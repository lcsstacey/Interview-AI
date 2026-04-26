#!/usr/bin/env bash
# One-shot installer for macOS.
set -e

cd "$(dirname "$0")"

echo "→ Checking Node.js…"
if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "  Installing Node 20 via Homebrew…"
    brew install node
  else
    echo "  Node not found and Homebrew not installed."
    echo "  Install Node 20+ from https://nodejs.org and re-run this script."
    exit 1
  fi
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  Node $NODE_MAJOR detected. Please upgrade to Node 18+ (20 recommended)."
  exit 1
fi

echo "→ Installing dependencies…"
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env — open it and add your API key(s)."
fi

cat <<EOF

✓ Interview Studio AI installed.

Next:
  1. Open .env and paste at least one key:
       ANTHROPIC_API_KEY=…   (recommended)
       OPENAI_API_KEY=…      (optional, also enables Whisper)
  2. Start the app:
       ./run.sh
  3. Open http://localhost:5173 in Chrome.

EOF
