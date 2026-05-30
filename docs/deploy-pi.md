# Deploying home-stats-app to a Raspberry Pi 3B+

## Context

This doc covers deploying the Next.js 16 chore/electricity dashboard from a
Windows dev machine to a **Raspberry Pi 3B+** running 24/7 as an always-on
home server on the LAN. The app is reached from phones via the Pi's hostname
or LAN IP. Goal: app survives reboots, restarts on crash, no dependency on
the dev machine being awake.

The 3B+ has **1 GB RAM**, which is the dominant constraint. `next build` peaks
above 1 GB, so we **build on Windows and ship a runtime bundle to the Pi**, not
build on the Pi. We also skip Docker — 1 GB doesn't have room for container
overhead on top of Node.

## Step 0 — Pi imager and OS choice

**Tool:** stick with **Raspberry Pi Imager** (official; cross-platform; the one
to use). Better than Etcher/dd because it bakes the headless SSH/Wi-Fi/user
config straight onto the SD card — no monitor or keyboard needed for first boot.

**OS choice:** Raspberry Pi OS Lite (64-bit), the Trixie port
— "A port of Debian Trixie with no desktop environment (Compatible with
Raspberry Pi 3)". Reasoning:
- *Lite* = no desktop. Saves RAM and disk on a 1 GB board. We never need a GUI.
- *64-bit* = required for modern Node and native modules. 3B+ supports it.
- *Trixie* = Debian 13 base (released 2025). Newer than Bookworm; Node 20 is in
  the default apt repos, but for Next.js 16 we'll pull Node 22 LTS from
  NodeSource to stay on a current LTS line.

**Advanced settings (gear icon, before writing the card):**
- Hostname: `homestats` → reachable as `homestats.local` via mDNS.
- Enable SSH → choose **"Allow public-key authentication only"** (see "Public-key
  auth" below for how to populate the key). Password SSH is disabled from the
  first boot, no extra hardening needed later.
- Username + password (avoid the obsolete `pi` / `raspberry` default). The
  password is still used for `sudo` even if SSH password auth is off.
- Wi-Fi SSID + password if no Ethernet. Ethernet is strongly preferred for a
  24/7 server — fewer reconnect headaches.
- Locale / timezone: `Europe/Stockholm`, keyboard `se`.

### Public-key auth setup

If you already have an ed25519 key serving another role (GitHub, work
server, etc.), you have two paths — **the dedicated-key path is recommended**
so a future compromise of either key doesn't bleed into the other. If you have
no existing key, just generate one as below and skip the "alternative".

All key generation happens **on the Windows machine** — the public half ends
up on the Pi via the Imager, the private half never leaves Windows.

Windows path conventions used below:
- Git Bash path: `/c/Users/<your-windows-username>/.ssh/...`
- Native Windows path: `C:\Users\<your-windows-username>\.ssh\...`
- These point to the same directory. Windows OpenSSH (ssh, ssh-keygen, rsync
  over ssh) reads from `C:\Users\<your-windows-username>\.ssh\` regardless of which shell
  invoked it.

**Recommended — generate a dedicated key for the Pi.** From Git Bash:

```
ssh-keygen -t ed25519 -f /c/Users/<your-windows-username>/.ssh/id_ed25519_homestats -C "homestats-deploy"
# Passphrase: empty for a hands-free deploy script, or set one and let the
# Windows OpenSSH agent (ssh-agent service) hold the unlocked key.
cat /c/Users/<your-windows-username>/.ssh/id_ed25519_homestats.pub   # copy the single line
```

(In PowerShell the same command is
`ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519_homestats" -C "homestats-deploy"`.)

Then make `ssh homestats` automatically pick that key. Create or append to
**`C:\Users\<your-windows-username>\.ssh\config`** (no file extension) — content:

```
Host homestats
    HostName homestats.local
    User <your-pi-username>
    IdentityFile ~/.ssh/id_ed25519_homestats
    IdentitiesOnly yes
```

The `~/.ssh/...` inside the config file is fine — OpenSSH expands it to
`C:\Users\<your-windows-username>\.ssh\` on Windows. Only the shell commands outside the
config file need the explicit path.

`IdentitiesOnly yes` is the key flag — without it OpenSSH offers every key in
`C:\Users\<your-windows-username>\.ssh\` to the Pi, which can trip rate limits and
accidentally log activity under the wrong identity. After this, `ssh homestats`
is equivalent to
`ssh -i C:\Users\<your-windows-username>\.ssh\id_ed25519_homestats <user>@homestats.local`.

**Alternative — reuse the existing key.** Same key can authorize many servers
without conflicting with whatever else it's already used for. Copy the contents
of `C:\Users\<your-windows-username>\.ssh\id_ed25519.pub` into the Imager. Skip the SSH
config addition. Less isolation between systems, but one fewer key to track.

**In Raspberry Pi Imager** → gear → SSH section → paste whichever public key
you chose into the "Allowed SSH public keys" box. Imager writes it to
`/home/<user>/.ssh/authorized_keys` on the SD card with correct perms.

After first boot, `ssh homestats` (or `ssh <user>@homestats.local` if you
skipped the alias) should log in without a password prompt. If it asks for one,
the key wasn't placed correctly — re-flash or fix manually under
`/home/<user>/.ssh/` on the Pi.

**SD card:** 16 GB is the floor; 32 GB Class 10 / A1 is the comfort target. Cheap
cards die from constant JSON writes — fine for a hobby home server but plan to
re-flash every couple of years, and lean toward USB-SSD if you have one spare.

## Step 1 — First boot + base packages

After flashing, boot the Pi, ssh in: `ssh <user>@homestats.local`.

```
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl git rsync avahi-daemon
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # expect v22.x
```

Node 22 LTS is the current active LTS line and the recommended floor for
Next.js 16. NodeSource's setup script auto-detects Trixie. `avahi-daemon` is
usually installed by default on Pi OS Lite but the explicit `apt install` is
idempotent and guarantees `homestats.local` mDNS resolution.

## Step 2 — App side: standalone output

[next.config.ts](../next.config.ts) sets `output: "standalone"`, which makes
`next build` emit `.next/standalone/server.js` plus a tiny, self-contained
`node_modules` with only the packages the app actually imports. The Pi runs
`node server.js`; no `npm install` on the Pi.

The standalone build does **not** copy `public/` or `.next/static/` — they must
be copied separately. The deploy script (Step 4) handles that.

## Step 3 — Pi-side directory layout

```
/srv/homestats/                    # owned by the deploy user
├── server.js                      # from .next/standalone/server.js
├── .next/                         # from .next/standalone/.next
├── node_modules/                  # from .next/standalone/node_modules
├── public/                        # copied from repo
├── .next/static/                  # copied from .next/static (static assets)
├── data/                          # JSON state lives here, persists across deploys
│   ├── chores-data.json           # tracked in git, ships with deploy
│   ├── chores-users.json          # untracked runtime data
│   ├── chores-state.json
│   ├── chores-points.json
│   └── chores-history.json
└── messages/                      # ships with deploy
```

The deploy script (next step) does an **exclude on `data/`** so we never
overwrite the Pi's accumulated runtime state. Only `data/chores-data.json`
(committed task definitions) needs to be pushed, and only when it changes.

## Step 4 — Build + deploy

### Step 4a — One-time prerequisite: run the deploy from WSL

Git Bash for Windows has no `rsync`, and Scoop's official buckets no
longer ship it either. Rather than fight Windows tooling, we run the deploy
from **WSL (Ubuntu)** where `rsync` is one apt away.

**One-time install (admin PowerShell):**

```
wsl --install
```

Reboot, then on next login Windows finishes setting up the default
Ubuntu distro and prompts for a WSL username + password. Pick anything;
this is separate from your Windows and Pi accounts.

**Inside the WSL shell, set up rsync, Node, and SSH keys:**

```bash
sudo apt update
sudo apt install -y rsync
# Node 22 LTS (matches what the Pi runs)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Reuse the Windows-side SSH config + key from Step 0
mkdir -p ~/.ssh
cp /mnt/c/Users/<your-windows-username>/.ssh/id_ed25519_homestats     ~/.ssh/
cp /mnt/c/Users/<your-windows-username>/.ssh/id_ed25519_homestats.pub ~/.ssh/
cp /mnt/c/Users/<your-windows-username>/.ssh/config                   ~/.ssh/
chmod 600 ~/.ssh/id_ed25519_homestats ~/.ssh/config

# Smoke-test the SSH config alias
ssh homestats "echo hello from \$(hostname)"
```

`/mnt/c/Users/<your-windows-username>/` is how WSL sees `C:\Users\<your-windows-username>\`. The
copy (not symlink) is intentional — OpenSSH refuses key files with
group/other perms, and `/mnt/c` files always look group-readable from
WSL's perspective regardless of the underlying Windows ACL.

**Running deploys from now on:**

```bash
cd /mnt/c/Users/<your-windows-username>/projects/home-stats-app
./deploy-to-pi.sh
```

`npm ci` + `next build` from WSL on `/mnt/c/...` is 20–50% slower than
on Windows native (cross-fs hop). Tolerable for this app — single-digit
seconds extra. VS Code keeps working as-is.

### Step 4b — The deploy script

The script lives at the repo root: [deploy-to-pi.sh](../deploy-to-pi.sh). It
defaults `PI_HOST` to `homestats` (the SSH config alias from Step 0), so user
and IP come from `~/.ssh/config`. Override per-run with env vars if needed:

```bash
PI_HOST=192.168.1.42 PI_USER=<pi-username> ./deploy-to-pi.sh
```

The script does:

1. `npm ci && npm run build` — produces the standalone bundle in `.next/standalone/`.
2. Stages it in `.deploy/`, strips any local `data/` Next's tracer pulled in,
   adds `public/`, `.next/static/`, and `messages/`.
3. `rsync -avz --delete --exclude='data/' .deploy/ <target>:/srv/homestats/` —
   ships the bundle, preserves the Pi's runtime `data/` dir.
4. `rsync` `data/chores-data.json` separately (the only committed data file).
5. `ssh <target> "sudo systemctl restart homestats"` — applies the update.

First-time setup needs the remote `/srv/homestats/data/` dir created (Step 6).

## Step 5 — systemd service on the Pi

Copy the [homestats.service](../homestats.service) template from the repo to
`/etc/systemd/system/homestats.service`, **edit the `User=<pi-username>` line**
to your actual Pi username, then:

```
sudo systemctl daemon-reload
sudo systemctl enable --now homestats
sudo systemctl status homestats
```

`enable --now` = start now AND on every boot. Covers auto-start on boot and
restart on crash.

`HOSTNAME=0.0.0.0` is required in the unit — Next.js standalone defaults to
`localhost` and would refuse LAN connections. If you forget to swap
`<pi-username>` for a real user, systemd will fail with "Failed to determine
user credentials" and loop on restart.

### Passwordless sudo for the restart step

`deploy-to-pi.sh` ends with `ssh "$PI_TARGET" "sudo systemctl restart homestats"`.
Over a non-interactive SSH session there's no TTY for sudo to prompt for a
password, so it fails with `sudo: a terminal is required to read the password`.

Grant the deploy user **passwordless sudo for only the systemctl operations on
this unit** — not blanket sudo. From the Pi:

```bash
SYSTEMCTL_PATH=$(command -v systemctl)
echo "$USER ALL=(ALL) NOPASSWD: $SYSTEMCTL_PATH restart homestats, $SYSTEMCTL_PATH status homestats, $SYSTEMCTL_PATH start homestats, $SYSTEMCTL_PATH stop homestats" | sudo tee /etc/sudoers.d/homestats > /dev/null
sudo chmod 0440 /etc/sudoers.d/homestats
sudo visudo -c -f /etc/sudoers.d/homestats   # syntax check; expect "parsed OK"
```

Verify (still on the Pi):

```bash
sudo -n systemctl restart homestats
```

`-n` means "fail if a password would be required". Silent success ⇒ the deploy
script's restart line will work over SSH.

## Step 6 — First-run bootstrap on the Pi

Before the first `deploy-to-pi.sh` run:

```
sudo mkdir -p /srv/homestats/data
sudo chown -R $USER:$USER /srv/homestats
```

Then run the deploy script. Runtime state files (`chores-state.json`,
`chores-points.json`, `chores-history.json`) are created on first API hit by
the `writeJson` helper in [app/api/chores/route.ts](../app/api/chores/route.ts).

`chores-users.json` is **not** auto-created — it has to exist before any chore
can be started (the API reads it in the `start` action to map names to IDs).
Either:

```bash
# Option A: copy your existing users from the dev machine to the Pi (from WSL)
scp data/chores-users.json homestats:/srv/homestats/data/

# Option B: seed from the committed template, then edit on the Pi
ssh homestats "cp /srv/homestats/data/chores-users.json.default /srv/homestats/data/chores-users.json"
```

If you want to migrate existing chore history too, scp those JSON files into
`/srv/homestats/data/` once before starting the service.

## Step 7 — Verification

1. `sudo systemctl status homestats` → active (running).
2. From Windows: `curl http://homestats.local:3000/sv/chores` → 200 with HTML.
3. From a phone on the LAN: open `http://homestats.local:3000` → chores board
   loads, scoreboard tiles render.
4. Take a chore through `start → finish → inspect` → confirm
   `/srv/homestats/data/chores-history.json` gains an entry.
5. `sudo reboot` the Pi → wait ~30 s → app reachable again without any manual
   action.
6. Optional sanity: `sudo journalctl -u homestats -f` while doing a chore →
   no errors.

## Deferred (out of scope for v1)

- **Backups.** A weekly `rsync` of `/srv/homestats/data/` to the Windows machine
  or a USB drive would be smart.
- **Reverse proxy / port 80.** This setup currently exposes port 3000. If we
  want pretty URLs, drop nginx or caddy in front later.
- **HTTPS.** Not needed on LAN. If the app ever leaves the LAN, add it then.

## Decisions to make before you start

- **Wi-Fi or Ethernet** for the Pi. Ethernet is strongly preferred for a 24/7
  server — Wi-Fi reconnects after router blips are flaky on older Pis.
- **Pi username.** Pick anything other than the obsolete `pi`/`raspberry`
  default. Wherever this doc says `<pi-username>`, substitute that name.
- **Seed `data/chores-users.json` on the Pi** with your existing users (Option
  A in Step 6) or start fresh (Option B). Without it, the first `start` action
  on a chore returns a 500.
