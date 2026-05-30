#!/usr/bin/env bash
set -euo pipefail

PI_HOST="${PI_HOST:-homestats.local}"
PI_USER="${PI_USER:-pi}"
REMOTE_DIR="/srv/homestats"

npm ci
npm run build

# Stage the standalone bundle locally
rm -rf .deploy
mkdir .deploy
cp -r .next/standalone/. .deploy/
# Strip any local runtime data Next's tracer pulled into the bundle —
# the Pi keeps its own data/ dir which we never overwrite.
rm -rf .deploy/data
mkdir -p .deploy/.next
cp -r .next/static .deploy/.next/static
cp -r public .deploy/public
cp -r messages .deploy/messages

# Ship to the Pi — preserve runtime data dir on the remote
rsync -avz --delete --exclude='data/' .deploy/ "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/"
# Push only the committed chore definitions (safe to overwrite)
rsync -avz data/chores-data.json "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/data/chores-data.json"

ssh "${PI_USER}@${PI_HOST}" "sudo systemctl restart homestats"
echo "Deployed. Open http://${PI_HOST}:3000/"
