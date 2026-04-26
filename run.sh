#!/usr/bin/env bash
# Launch the copilot and open it in the default browser.
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env found. Run: bash install.sh"
  exit 1
fi

PORT=$(grep -E '^PORT=' .env | cut -d= -f2)
PORT=${PORT:-3000}

(sleep 1 && open "http://localhost:$PORT") &
exec npm start
