#!/usr/bin/env bash
# Build a Mac .dmg you can drag into /Applications.
#
# Output:
#   release/Interview Studio AI-2.0.0-arm64.dmg   (Apple Silicon)
#   release/Interview Studio AI-2.0.0-x64.dmg     (Intel)
#
# Note: this is an unsigned local build. The first time you open the .app,
# right-click → Open and confirm, since macOS Gatekeeper blocks unsigned apps
# by default. (Code signing requires an Apple Developer account.)
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "node_modules missing. Run: bash install.sh"
  exit 1
fi

echo "→ Building React UI…"
npm run build

echo "→ Packaging Electron app for macOS…"
npx electron-builder --mac --config electron-builder.config.cjs

echo
echo "✓ Done."
echo
ls -lh release/*.dmg 2>/dev/null || true
echo
echo "Open the .dmg, drag 'Interview Studio AI' into Applications, and you're set."
