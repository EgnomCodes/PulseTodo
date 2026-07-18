#!/usr/bin/env bash
# Build an iOS IPA via Expo EAS (cloud Mac), then install with SideStore/AltStore.
set -euo pipefail
cd "$(dirname "$0")"

if ! npx eas whoami >/dev/null 2>&1; then
  echo "Log into Expo first:"
  echo "  npx eas login"
  exit 1
fi

if grep -q 'replace-after-eas-init' app.json; then
  echo "Remove the fake projectId from app.json, then run:"
  echo "  npx eas init"
  echo "(Leaving replace-after-eas-init causes: Invalid UUID appId)"
  exit 1
fi

echo "Starting iOS IPA build (profile: preview)..."
npx eas build -p ios --profile preview --non-interactive

echo
echo "When the build finishes, download the .ipa from the Expo link above,"
echo "then install it with SideStore (recommended) or AltStore for automated 7-day refresh."
echo "Refreshing keeps your todos as long as the bundle id stays com.pulsetodo.app."
