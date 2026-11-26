#!/usr/bin/env bash
# Merge the Koi Store dev allowlist into .claude/settings.local.json.
# Safe to rerun: existing entries are kept, duplicates are not added.
#
# Usage: .claude/update-permissions.sh [all|bash|playwright] [--dry-run]
#   all         Bash rules + every Playwright MCP tool (default)
#   bash        only the Bash(...) rules
#   playwright  only mcp__playwright
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/.claude/settings.local.json"
mode="all"
dry=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry=1 ;;
    all|bash|playwright) mode="$arg" ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

python3 - "$file" "$dry" "$mode" <<'PY'
import json, os, sys

path, dry, mode = sys.argv[1], sys.argv[2] == "1", sys.argv[3]

bash_rules = [
    # checks and dev commands used by the role agents
    "Bash(bun run:*)",
    "Bash(bun test:*)",
    "Bash(bunx:*)",
    "Bash(docker run:*)",
    "Bash(docker compose:*)",
    "Bash(docker ps:*)",
    # read and navigation
    "Bash(git status:*)",
    "Bash(git diff:*)",
    "Bash(git log:*)",
    "Bash(git stash list:*)",
    "Bash(git stash push:*)",
    "Bash(git stash pop:*)",
    "Bash(tmux:*)",
    "Bash(ps:*)",
    "Bash(ss:*)",
    "Bash(free:*)",
    "Bash(pgrep:*)",
    "Bash(lsof:*)",
    "Bash(ls:*)",
    "Bash(find:*)",
    "Bash(wc:*)",
    "Bash(mkdir:*)",
    "Bash(cp:*)",
    "Bash(awk:*)",
    "Bash(sed:*)",
    # local dev server probes only
    "Bash(curl http://localhost:*)",
    "Bash(curl http://127.0.0.1:*)",
]

mcp_rules = [
    # every tool of the Playwright MCP server, including future ones.
    # Note: covers browser_run_code_unsafe too.
    "mcp__playwright",
]

if mode == "bash":
    allow = bash_rules
elif mode == "playwright":
    allow = mcp_rules
else:
    allow = bash_rules + mcp_rules

data = {}
if os.path.exists(path):
    with open(path) as f:
        data = json.load(f) or {}

perms = data.setdefault("permissions", {})
current = perms.setdefault("allow", [])
added = [r for r in allow if r not in current]
merged = current + added
perms["allow"] = merged

print(f"{path}: {len(current)} -> {len(merged)} rules (mode: {mode})")
for r in added:
    print("  +", r)
if not added:
    print("  nothing to add")

if dry:
    print("(dry run, not written)")
    sys.exit(0)

os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("written")
PY
