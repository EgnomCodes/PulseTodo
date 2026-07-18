#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
OUT="${1:-$HOME/Desktop/PulseTodo-IPA}"
cd "$(dirname "$0")"

echo "Waiting for latest successful IPA build..."
# Prefer in-progress run if any, else latest success
RUN_ID=$(gh run list --workflow="build-ios-ipa.yml" --limit 5 --json databaseId,status,conclusion \
  --jq '[.[] | select(.status=="in_progress" or .status=="queued")][0].databaseId // empty')

if [ -n "${RUN_ID}" ]; then
  echo "Watching run $RUN_ID ..."
  gh run watch "$RUN_ID" --exit-status
else
  RUN_ID=$(gh run list --workflow="build-ios-ipa.yml" --limit 1 --json databaseId,conclusion \
    --jq '.[0] | select(.conclusion=="success") | .databaseId')
fi

if [ -z "${RUN_ID}" ]; then
  RUN_ID=$(gh run list --workflow="build-ios-ipa.yml" --limit 5 --json databaseId,conclusion \
    --jq '[.[] | select(.conclusion=="success")][0].databaseId')
fi

echo "Downloading artifact from run $RUN_ID -> $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"
gh run download "$RUN_ID" -n PulseTodo-ipa -D "$OUT"
ls -lh "$OUT"
echo "Done: $OUT/PulseTodo.ipa"
