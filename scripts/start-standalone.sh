#!/usr/bin/env sh
# Runs the standalone production server locally (mirrors what the Docker image does).
set -e
cd "$(dirname "$0")/.."
if [ ! -f .next/standalone/server.js ]; then echo "Run 'npm run build' first." >&2; exit 1; fi
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r drizzle .next/standalone/drizzle
exec node .next/standalone/server.js
