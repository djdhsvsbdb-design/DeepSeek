#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIST="$ROOT/apps/web/dist"
ANDROID_ASSETS="$ROOT/android/app/src/main/assets/dsh/web"

if [[ ! -d "$WEB_DIST" ]]; then
  echo "Web frontend dist not found. Run pnpm --filter @deepseek-ai/dsh-web-frontend build first." >&2
  exit 1
fi
rm -rf "$ANDROID_ASSETS"
mkdir -p "$ANDROID_ASSETS"
cp -R "$WEB_DIST/." "$ANDROID_ASSETS/"
if [[ ! -f "$ANDROID_ASSETS/index.html" ]]; then
  echo "Frontend staging failed: index.html missing." >&2
  exit 1
fi
printf 'Staged frontend files: '
find "$ANDROID_ASSETS" -type f | wc -l
