# Deco stats collector

Polls a TP-Link Deco (X50) over its **local** encrypted API and appends time-series
data that the app reads from `data/router-stats.json` (rolling 48h) and
`data/router-daily.json` (durable per-day history). Both files are gitignored.

## What it collects

- **Throughput over time** — total + per-client instantaneous up/down speed.
- **Node health** — whole-network CPU & memory (the local API only reports these
  network-wide, not per node), plus each mesh node's model/role/firmware,
  internet status, and mesh uplink signal bars.
- **Client data usage (estimated)** — the local API exposes no cumulative per-client
  byte counters, so daily usage is *estimated* by integrating sampled speeds over
  time. Treat it as directional, not billing-grade.

## Local dev (Windows)

```bash
python -m venv scripts/.venv
scripts/.venv/Scripts/python -m pip install -r scripts/requirements.txt
DECO_HOST=http://192.168.68.1 DECO_PASSWORD=... scripts/.venv/Scripts/python scripts/deco-collector.py --once --raw
```

`--once` prints a sample and writes nothing; `--raw` also dumps the raw API JSON to
stderr (use it to confirm which fields your firmware populates and the speed unit).
Run `--once` on a terminal with no `DECO_PASSWORD` set and it prompts for the password
(via getpass), so the smoke test never has to write the password anywhere.

## Where the password lives

The password is resolved in this order: a systemd **encrypted credential**
(`$CREDENTIALS_DIRECTORY/deco_password`) → `DECO_PASSWORD` env → interactive prompt
(`--once` only). For the unattended Pi timer, use the encrypted credential — the
plaintext never sits on disk and the blob is bound to that machine. `deco.env` holds
only non-secret config (`DECO_HOST`, optional `DECO_USERNAME` / `DECO_STATS_WINDOW_HOURS`).

## One-time setup on the Pi

```bash
cd /opt/homestats/scripts          # wherever deploy-to-pi.sh placed the app
sudo apt install -y python3-venv
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# non-secret config — never put the password here
cat > deco.env <<'EOF'
DECO_HOST=http://192.168.68.1
EOF

# encrypt the admin password into a machine-bound blob (no plaintext on disk)
sudo mkdir -p /etc/homestats
echo -n 'your-admin-pw' | sudo systemd-creds encrypt --name=deco_password - /etc/homestats/deco_password.cred
sudo chmod 600 /etc/homestats/deco_password.cred

# verify connectivity (X50(1.0) hardware) — prompts for the password, stores nothing
set -a; . ./deco.env; set +a
.venv/bin/python deco-collector.py --once

# install + enable the 5-minute timer (edit paths/User in the unit first)
sudo cp systemd/deco-collector.service systemd/deco-collector.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now deco-collector.timer
systemctl list-timers deco-collector.timer

# confirm the encrypted credential decrypts for the service
sudo systemctl start deco-collector.service && journalctl -u deco-collector.service -n 20
```

## Notes

- Logging in as `admin` may log out the Deco app's owner session — expected.
- If the smoke test shows speeds in a unit other than KB/s, change only
  `SPEED_UNIT_KB_PER_S` in `deco-collector.py`.
