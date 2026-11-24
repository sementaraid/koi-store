#!/usr/bin/env bash
# Start the Koi Store dev stack (API :9000, storefront :3001, admin :3002) in a
# detached tmux session, so it keeps running after you close the terminal.
#
#   ./scripts/dev-up.sh          start (or report that it is already running)
#   tmux attach -t koi-store-dev watch the logs (detach: Ctrl-b then d)
#
# It also makes sure packages/api/.env has the dev PII key. Without it, every
# response that touches an encrypted phone or bank field fails with a 500.
# The value is the public dev key, not a production secret. An existing
# non-empty key is never overwritten, and the file is never printed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SESSION="koi-store-dev"
API_ENV="$ROOT/packages/api/.env"
DEV_PII_KEY="MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="

if [ -f "$API_ENV" ]; then
  if grep -q '^PII_ENCRYPTION_KEY=$' "$API_ENV"; then
    sed -i "s|^PII_ENCRYPTION_KEY=\$|PII_ENCRYPTION_KEY=$DEV_PII_KEY|" "$API_ENV"
    echo "Filled the empty PII_ENCRYPTION_KEY in packages/api/.env with the dev key."
  elif ! grep -q '^PII_ENCRYPTION_KEY=' "$API_ENV"; then
    printf '\nPII_ENCRYPTION_KEY=%s\n' "$DEV_PII_KEY" >> "$API_ENV"
    echo "Added the dev PII_ENCRYPTION_KEY to packages/api/.env."
  fi
else
  echo "Warning: $API_ENV not found. Copy packages/api/.env.template first." >&2
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Dev stack is already running in tmux session '$SESSION'."
  echo "Logs: tmux attach -t $SESSION"
  exit 0
fi

# A login shell so bun from ~/.bun/bin is on PATH. The trailing bash keeps the
# pane open after a crash, so the error stays readable.
tmux new-session -d -s "$SESSION" -c "$ROOT" "bash -lc 'bun run dev; echo; echo \"bun run dev exited\"; exec bash'"

echo "Started the dev stack in tmux session '$SESSION'."
echo "Storefront: http://localhost:3001  (https://koi-dev.sunar.dev)"
echo "Admin:      http://localhost:3002  (https://koi-backoffice-dev.sunar.dev)"
echo "API:        http://localhost:9000  (https://api.koi-dev.sunar.dev)"
echo "Logs:       tmux attach -t $SESSION"
