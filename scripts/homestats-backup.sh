#!/usr/bin/env bash
set -euo pipefail

SRC="/srv/homestats/data"
DEST="$HOME/homestats-backups"
RETAIN=30

mkdir -p "$DEST"

DATE=$(date +%Y-%m-%d)
ARCHIVE="$DEST/homestats-data-$DATE.zip"

# Zip every runtime JSON file. The `chores-*.json` glob does NOT match
# `*.json.default` files (they end in .default, not .json) — so the
# committed seed templates are excluded automatically.
# -j: don't store the full path in the archive (junk dirs)
# -q: quiet
zip -j -q "$ARCHIVE" "$SRC"/chores-*.json

# Rotate: keep the $RETAIN newest, delete the rest.
ls -1t "$DEST"/homestats-data-*.zip 2>/dev/null \
  | tail -n +$((RETAIN + 1)) \
  | xargs -r rm -f

echo "$(date '+%Y-%m-%d %H:%M:%S')  backed up to $ARCHIVE"
