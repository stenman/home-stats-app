#!/usr/bin/env bash
set -euo pipefail

PI_HOST="${PI_HOST:-homestats}"
PI_USER="${PI_USER:-}"
REMOTE_DIR="/srv/homestats"
PI_TARGET="${PI_USER:+${PI_USER}@}${PI_HOST}"

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

# Ship to the Pi — preserve runtime data dir on the remote (chores-data.json
# is now runtime state on the Pi, edited via the in-app editor, so we leave it
# alone too — bootstrap from chores-data.json.default on first run).
rsync -avz --delete --exclude='data/' .deploy/ "${PI_TARGET}:${REMOTE_DIR}/"

ssh "${PI_TARGET}" "sudo systemctl restart homestats"
echo "Deployed. Open http://${PI_HOST}/"
