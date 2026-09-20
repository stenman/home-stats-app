#!/usr/bin/env python3
"""Poll a TP-Link Deco (X50) over its LOCAL encrypted API and append time-series
statistics that the home-stats-app reads.

TP-Link exposes no official local API, but the Deco app/web-admin speaks an
encrypted JSON API (RSA key exchange + AES-128-CBC session). The `tplinkrouterc6u`
library implements that handshake; we use its `TPLinkDecoClient` purely as an
authenticated transport and then call the raw `admin/...?form=...` endpoints so we
get more fields than the library's high-level `get_status()` surfaces.

What the local API actually provides (verified against the X50 firmware family):
  - admin/network?form=performance  -> whole-network cpu_usage / mem_usage (0..1)
  - admin/device?form=device_list   -> per mesh node: nickname, model, role,
                                       firmware, inet_status, uplink signal bars
  - admin/client?form=client_list   -> per online client: mac, ip, name, conn type,
                                       and INSTANTANEOUS up_speed / down_speed
It does NOT expose cumulative per-client byte counters, so daily "data usage" is
ESTIMATED by integrating the sampled speeds over time (see compute_daily).

Storage (both files gitignored, live in ../data):
  - router-stats.json : rolling window of raw samples (default last 48h) for the
                        recent throughput / node-health / cpu-mem charts.
  - router-daily.json : one record per local date (durable history) with daily
                        avg/peak throughput, avg/max cpu+mem, and the estimated
                        per-client usage. Rebuilt from the stats window each run,
                        so it is robust to the exact poll cadence.

Usage:
  python deco-collector.py --once [--raw]   # one poll, print to stdout, write nothing
  python deco-collector.py                  # poll, append to stats, refresh daily

Config (set on the Pi; never commit). Non-secret settings come from env or a
sibling `deco.env` (KEY=VALUE per line):
  DECO_HOST=http://192.168.68.1
  DECO_USERNAME=admin            # optional, defaults to admin
  DECO_STATS_WINDOW_HOURS=48     # optional

The admin password is resolved in this order (first hit wins):
  1. systemd encrypted credential -> $CREDENTIALS_DIRECTORY/deco_password
     (preferred for the unattended timer; plaintext never sits on disk)
  2. DECO_PASSWORD env var / deco.env  (handy for ad-hoc local runs)
  3. interactive prompt, only with --once on a TTY (so the smoke test needs no file)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from base64 import b64decode
from datetime import datetime, timedelta, timezone
from pathlib import Path

from tplinkrouterc6u import TPLinkDecoClient

# --- paths ---------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent / "data"
STATS_FILE = DATA_DIR / "router-stats.json"
DAILY_FILE = DATA_DIR / "router-daily.json"
COLLECTOR_STATE_FILE = DATA_DIR / "router-collector.json"
ENV_FILE = SCRIPT_DIR / "deco.env"

# --- tunables ------------------------------------------------------------
DEFAULT_WINDOW_HOURS = 48
# Max gap (seconds) credited to a single sample when integrating speeds into a
# daily total. Guards against a reboot / downtime gap inflating "usage".
MAX_INTEGRATION_GAP_S = 15 * 60
# The Deco client_list speeds are treated as KB/s when estimating daily usage.
# If the smoke test shows a different magnitude, change only this divisor.
SPEED_UNIT_KB_PER_S = 1.0


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def collector_enabled() -> bool:
    """On/off switch shared with the web UI (data/router-collector.json).
    Absent or unreadable file means enabled."""
    try:
        data = json.loads(COLLECTOR_STATE_FILE.read_text(encoding="utf-8"))
        return data.get("enabled", True) is not False
    except (OSError, ValueError):
        return True


def resolve_password(interactive_ok: bool) -> str | None:
    """Find the admin password without ever requiring it on disk in plaintext.

    systemd's LoadCredentialEncrypted= decrypts the credential into a private
    tmpfs at $CREDENTIALS_DIRECTORY for the lifetime of the service only.
    """
    cred_dir = os.environ.get("CREDENTIALS_DIRECTORY")
    if cred_dir:
        cred_path = Path(cred_dir) / "deco_password"
        if cred_path.exists():
            return cred_path.read_text(encoding="utf-8").strip("\n")
    env_pw = os.environ.get("DECO_PASSWORD")
    if env_pw:
        return env_pw
    if interactive_ok and sys.stdin.isatty():
        import getpass

        return getpass.getpass("Deco admin password: ")
    return None


def decode_name(raw: str) -> str:
    try:
        return b64decode(raw).decode()
    except Exception:
        return raw or ""


def to_int(value) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def request(client: TPLinkDecoClient, path: str, payload: dict) -> dict:
    result = client.request(path, json.dumps(payload))
    return result if isinstance(result, dict) else {}


def collect(client: TPLinkDecoClient) -> tuple[dict, dict]:
    """Return (sample, raw_responses). `sample` is the compact persisted shape."""
    raw_devices = request(client, "admin/device?form=device_list", {"operation": "read"})
    raw_perf = request(client, "admin/network?form=performance", {"operation": "read"})
    raw_clients = request(
        client,
        "admin/client?form=client_list",
        {"operation": "read", "params": {"device_mac": "default"}},
    )

    nodes = []
    for item in raw_devices.get("device_list", []):
        signal = item.get("signal_level") or {}
        nodes.append(
            {
                "mac": item.get("mac", ""),
                "nickname": decode_name(item.get("nickname", "")) or item.get("device_model", ""),
                "model": item.get("device_model", ""),
                "role": item.get("role", ""),
                "firmware": item.get("software_ver", ""),
                "hardware": item.get("hardware_ver", ""),
                "inetStatus": item.get("inet_status", ""),
                "signal2g": to_int(signal.get("band2_4")),
                "signal5g": to_int(signal.get("band5")),
            }
        )

    clients = []
    total_down = 0
    total_up = 0
    wired = wifi = guest = 0
    for item in raw_clients.get("client_list", []):
        if not item.get("online"):
            continue
        down = to_int(item.get("down_speed")) or 0
        up = to_int(item.get("up_speed")) or 0
        total_down += down
        total_up += up
        wire_type = item.get("wire_type", "")
        interface = item.get("interface", "")  # main | guest
        if wire_type == "wired":
            wired += 1
        elif interface == "guest":
            guest += 1
        else:
            wifi += 1
        clients.append(
            {
                "mac": item.get("mac", ""),
                "name": decode_name(item.get("name", "")),
                "ip": item.get("ip", ""),
                "conn": item.get("connection_type", wire_type),
                "interface": interface,
                "downSpeed": down,
                "upSpeed": up,
            }
        )

    sample = {
        "ts": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "cpuUsage": raw_perf.get("cpu_usage"),
        "memUsage": raw_perf.get("mem_usage"),
        "totals": {
            "downSpeed": total_down,
            "upSpeed": total_up,
            "clients": len(clients),
            "wired": wired,
            "wifi": wifi,
            "guest": guest,
        },
        "nodes": nodes,
        "clients": clients,
    }
    raw = {"device_list": raw_devices, "performance": raw_perf, "client_list": raw_clients}
    return sample, raw


# --- persistence ---------------------------------------------------------
def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def prune(samples: list[dict], window_hours: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    kept = [s for s in samples if parse_ts(s["ts"]) >= cutoff]
    kept.sort(key=lambda s: s["ts"])
    return kept


def compute_daily(samples: list[dict]) -> list[dict]:
    """Build one record per LOCAL date from the (sorted) stats window.

    Speeds are integrated over the gap to the next sample to estimate per-client
    and total data moved that day. This is an approximation: traffic bursts
    between polls are missed, so treat the usage figures as directional.
    """
    by_date: dict[str, list[dict]] = {}
    for s in samples:
        local_date = parse_ts(s["ts"]).astimezone().strftime("%Y-%m-%d")
        by_date.setdefault(local_date, []).append(s)

    records = []
    for date, day_samples in sorted(by_date.items()):
        day_samples.sort(key=lambda s: s["ts"])
        down_speeds = [s["totals"]["downSpeed"] for s in day_samples]
        up_speeds = [s["totals"]["upSpeed"] for s in day_samples]
        cpus = [s["cpuUsage"] for s in day_samples if s["cpuUsage"] is not None]
        mems = [s["memUsage"] for s in day_samples if s["memUsage"] is not None]

        client_kb: dict[str, dict] = {}
        for i, s in enumerate(day_samples):
            if i + 1 < len(day_samples):
                dt = (parse_ts(day_samples[i + 1]["ts"]) - parse_ts(s["ts"])).total_seconds()
                dt = min(max(dt, 0), MAX_INTEGRATION_GAP_S)
            else:
                dt = 0
            for c in s["clients"]:
                mac = c["mac"] or c["name"]
                entry = client_kb.setdefault(
                    mac, {"mac": c["mac"], "name": c["name"], "downKB": 0.0, "upKB": 0.0, "samples": 0}
                )
                entry["name"] = c["name"] or entry["name"]
                entry["downKB"] += c["downSpeed"] * SPEED_UNIT_KB_PER_S * dt
                entry["upKB"] += c["upSpeed"] * SPEED_UNIT_KB_PER_S * dt
                entry["samples"] += 1

        clients = sorted(client_kb.values(), key=lambda e: e["downKB"] + e["upKB"], reverse=True)
        for c in clients:
            c["downKB"] = round(c["downKB"], 1)
            c["upKB"] = round(c["upKB"], 1)

        records.append(
            {
                "date": date,
                "samples": len(day_samples),
                "avgDownSpeed": round(sum(down_speeds) / len(down_speeds), 1) if down_speeds else 0,
                "avgUpSpeed": round(sum(up_speeds) / len(up_speeds), 1) if up_speeds else 0,
                "peakDownSpeed": max(down_speeds, default=0),
                "peakUpSpeed": max(up_speeds, default=0),
                "avgCpu": round(sum(cpus) / len(cpus), 3) if cpus else None,
                "avgMem": round(sum(mems) / len(mems), 3) if mems else None,
                "maxCpu": max(cpus, default=None) if cpus else None,
                "maxMem": max(mems, default=None) if mems else None,
                "clients": clients,
            }
        )
    return records


def merge_daily(existing: list[dict], recomputed: list[dict]) -> list[dict]:
    """Replace records for dates present in the stats window; keep older ones."""
    recomputed_dates = {r["date"] for r in recomputed}
    merged = [r for r in existing if r["date"] not in recomputed_dates] + recomputed
    merged.sort(key=lambda r: r["date"])
    return merged


def persist(sample: dict, window_hours: int) -> None:
    samples = read_json(STATS_FILE, [])
    if not isinstance(samples, list):
        samples = []
    samples.append(sample)
    samples = prune(samples, window_hours)
    write_json(STATS_FILE, samples)

    existing_daily = read_json(DAILY_FILE, [])
    if not isinstance(existing_daily, list):
        existing_daily = []
    write_json(DAILY_FILE, merge_daily(existing_daily, compute_daily(samples)))


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect TP-Link Deco local stats.")
    parser.add_argument("--once", action="store_true", help="poll once, print, write nothing")
    parser.add_argument("--raw", action="store_true", help="with --once, also dump raw API JSON")
    args = parser.parse_args()

    # Scheduled runs respect the UI switch; --once is a manual action and always runs.
    if not args.once and not collector_enabled():
        print("collector disabled via UI toggle; skipping run.")
        return 0

    load_env_file()
    host = os.environ.get("DECO_HOST")
    username = os.environ.get("DECO_USERNAME", "admin")
    window_hours = int(os.environ.get("DECO_STATS_WINDOW_HOURS", DEFAULT_WINDOW_HOURS))
    password = resolve_password(interactive_ok=args.once)
    if not host:
        print("ERROR: set DECO_HOST (env or scripts/deco.env).", file=sys.stderr)
        return 2
    if not password:
        print(
            "ERROR: no password found. Use a systemd encrypted credential "
            "(deco_password), set DECO_PASSWORD, or run --once on a terminal to be prompted.",
            file=sys.stderr,
        )
        return 2

    # Deco serves its admin API over HTTPS with a self-signed cert, so verification
    # is off by default. It's a trusted device on your LAN; set DECO_VERIFY_SSL=true
    # to re-enable (only useful if you've installed the Deco's cert as trusted).
    verify_ssl = os.environ.get("DECO_VERIFY_SSL", "false").strip().lower() in ("1", "true", "yes")
    if not verify_ssl:
        try:
            from urllib3 import disable_warnings
            from urllib3.exceptions import InsecureRequestWarning

            disable_warnings(InsecureRequestWarning)
        except Exception:
            pass

    client = TPLinkDecoClient(host, password, username=username, verify_ssl=verify_ssl)
    client.authorize()
    try:
        sample, raw = collect(client)
    finally:
        try:
            client.logout()
        except Exception:
            pass

    if args.once:
        print(json.dumps(sample, ensure_ascii=False, indent=2))
        if args.raw:
            print("\n--- RAW ---", file=sys.stderr)
            print(json.dumps(raw, ensure_ascii=False, indent=2), file=sys.stderr)
        return 0

    persist(sample, window_hours)
    t = sample["totals"]
    print(
        f"{sample['ts']} ok: {t['clients']} clients, "
        f"down={t['downSpeed']} up={t['upSpeed']}, {len(sample['nodes'])} nodes"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
