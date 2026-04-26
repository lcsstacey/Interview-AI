#!/usr/bin/env bash
# One-shot installer for macOS.
# Usage: bash install.sh
set -e

cd "$(dirname "$0")"

echo "→ Checking Node.js…"
if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "  Installing Node via Homebrew…"
    brew install node
  else
    echo "  Node not found and Homebrew not installed."
    echo "  Install Node 20+ from https://nodejs.org and re-run this script."
    exit 1
  fi
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  Node $NODE_MAJOR detected. Please upgrade to Node 18+."
  exit 1
fi

echo "→ Installing npm dependencies…"
npm install --silent

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env — open it and add your API key(s)."
fi

echo
echo "✓ Installed."
echo "  1. Edit .env and add OPENAI_API_KEY and/or ANTHROPIC_API_KEY"
echo "  2. Run:  ./run.sh   (or  npm start)"
echo "  3. Open: http://localhost:3000"
