#!/usr/bin/env bash
set -euo pipefail

# Ensure dependencies are installed (pnpm). Render may not automatically run pnpm install for subfolder apps.
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile || pnpm install
else
  echo "pnpm not found, attempting to use npm"
  npm install
fi

# Start the server
node server.js
