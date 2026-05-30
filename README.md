# home-stats-app

A small Next.js dashboard for the home, run on a LAN as an always-on server.
Two sections:

- **Family Chores** — a board where family members start, finish, and get
  chores inspected to earn points (with a scoreboard).
- **Household Electricity** — electricity usage stats.

Bilingual (English / Swedish) via `next-intl`.

## Setup

State lives as JSON under `data/`. The two files you edit to make it yours:

- **`data/chores-data.json`** — the chore definitions (id, icon, `titleKey`,
  points). Each `titleKey` must have a matching translation in
  [messages/en.json](messages/en.json) and [messages/sv.json](messages/sv.json).
- **`data/chores-users.json`** — the family members (`id`, `name`, `emoji`).
  Copy `data/chores-users.json.default` to `data/chores-users.json` and edit.
  Required — the chores API needs it before any chore can be started.

The remaining `data/chores-*.json` files (state, points, history) are runtime
data and are created/updated automatically.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## Deploy

Built on the dev machine and shipped as a standalone bundle to a Raspberry Pi
over SSH/rsync, served by systemd on port 80 (reachable at
`http://homestats.local`):

```bash
./deploy-to-pi.sh
```

Full Pi provisioning, systemd unit, and first-run bootstrap are documented in
[docs/deploy-pi.md](docs/deploy-pi.md).
