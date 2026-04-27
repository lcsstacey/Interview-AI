#!/usr/bin/env bash
# Build and run in production mode (single port, http://localhost:3001).
set -e
cd "$(dirname "$0")"
npm run build
(sleep 1 && open "http://localhost:3001") &
exec npm start
