#!/usr/bin/env bash
# Merge the Koi Store dev allowlist into .claude/settings.local.json.
# Safe to rerun: existing entries are kept, duplicates are not added.
# Usage: .claude/update-permissions.sh [--dry-run]
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/.claude/settings.local.json"
dry=0
[[ "${1:-}" == "--dry-run" ]] && dry=1

python3 - "$file" "$dry" <<'PY'
import json, os, sys

path, dry = sys.argv[1], sys.argv[2] == "1"

allow = [
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
    # every tool of the Playwright MCP server, including future ones.
    # Note: covers browser_run_code_unsafe too.
    "mcp__playwright",
]

data = {}
if os.path.exists(path):
    with open(path) as f:
        data = json.load(f) or {}

perms = data.setdefault("permissions", {})
current = perms.setdefault("allow", [])
added = [r for r in allow if r not in current]
merged = current + added
perms["allow"] = merged

print(f"{path}: {len(current)} -> {len(merged)} rules")
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
