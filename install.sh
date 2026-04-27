#!/usr/bin/env bash
# One-shot installer for macOS dev environment.
# For a "drag-to-Applications" install, run:  bash package.sh
set -e
cd "$(dirname "$0")"

echo "→ Checking Node.js…"
if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "  Installing Node 20 via Homebrew…"
    brew install node
  else
    echo "  Node not found. Install Node 20+ from https://nodejs.org and re-run."
    exit 1
  fi
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  Node $NODE_MAJOR detected. Please upgrade to Node 18+ (20 recommended)."
  exit 1
fi

echo "→ Installing dependencies (this includes Electron, takes a minute)…"
npm install

cat <<EOF

✓ Interview Studio AI is installed.

You have two ways to run it:

  1. Run as a regular web app (fastest dev loop):
       ./run.sh
     Open http://localhost:5173 in Chrome.

  2. Build the Mac app and drag it into /Applications:
       bash package.sh
     The .dmg shows up in ./release/   ⇒   open it, drag the app over.

You add API keys inside the app, in the Settings page — no .env editing needed.

EOF
