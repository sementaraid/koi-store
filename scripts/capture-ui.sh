#!/usr/bin/env bash
# Screenshot every Koi Store page into ui-reference/<date>/ (see capture-ui.mjs).
# Uses the same Playwright image as the playwright MCP server, so nothing is
# installed in the repo. Pass overrides as env, e.g.:
#   STORE_URL=http://127.0.0.1:3001 ADMIN_URL=http://127.0.0.1:3002 scripts/capture-ui.sh
#   ONLY=admin scripts/capture-ui.sh
set -euo pipefail
cd "$(dirname "$0")/.."

docker run --rm --init --network=host --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e STORE_URL -e ADMIN_URL -e BUYER_EMAIL -e FARMER_EMAIL -e ADMIN_EMAIL \
  -e PASSWORD -e OUT_DIR -e ONLY \
  -v "$PWD:/workspace" -w /workspace \
  --entrypoint node \
  mcr.microsoft.com/playwright/mcp:latest \
  scripts/capture-ui.mjs
