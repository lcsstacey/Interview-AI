#!/usr/bin/env bash
# Launch Interview Studio AI in development.
# - Backend on http://localhost:3001
# - Vite dev server on http://localhost:5173 (the one you open in Chrome)
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env found. Run: bash install.sh"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "node_modules missing. Run: bash install.sh"
  exit 1
fi

(sleep 2.5 && open "http://localhost:5173") &
exec npm run dev
