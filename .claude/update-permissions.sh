#!/usr/bin/env bash
# Merge the Koi Store dev allowlist into .claude/settings.local.json.
# Safe to rerun: existing entries are kept, duplicates are not added.
#
# Usage: .claude/update-permissions.sh [all|bash|playwright|tools] [--dry-run]
#   all         Bash + MCP + file/research tools (default)
#   bash        only the Bash(...) rules
#   playwright  only mcp__playwright
#   tools       only Read/Edit/Write/Glob/Grep/Skill/ToolSearch/Agent/WebFetch/WebSearch
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/.claude/settings.local.json"
mode="all"
dry=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry=1 ;;
    all|bash|playwright|tools) mode="$arg" ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

python3 - "$file" "$dry" "$mode" <<'PY'
import json, os, sys

path, dry, mode = sys.argv[1], sys.argv[2] == "1", sys.argv[3]

bash_rules = [
    # checks, dev commands, processes and containers used by the role agents
    "Bash(bun run:*)",
    "Bash(bun test:*)",
    "Bash(bunx:*)",
    "Bash(docker:*)",
    "Bash(psql:*)",
    "Bash(pg_dump:*)",
    "Bash(pg_restore:*)",
    "Bash(gzip:*)",
    "Bash(gunzip:*)",
    "Bash(tar:*)",
    "Bash(timeout:*)",
    "Bash(sleep:*)",
    "Bash(xargs:*)",
    "Bash(tee:*)",
    # git (push, force-push, reset --hard stay denied or asked in settings.json)
    "Bash(git:*)",
    # read and navigation
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
    "Bash(mv:*)",
    "Bash(chmod:*)",
    "Bash(cat:*)",
    "Bash(head:*)",
    "Bash(tail:*)",
    "Bash(echo:*)",
    "Bash(grep:*)",
    "Bash(awk:*)",
    "Bash(sed:*)",
    "Bash(sort:*)",
    "Bash(uniq:*)",
    "Bash(cut:*)",
    "Bash(tr:*)",
    "Bash(jq:*)",
    "Bash(which:*)",
    "Bash(python3:*)",
    "Bash(node:*)",
    "Bash(curl:*)",
]

mcp_rules = [
    # every tool of the MCP servers this repo uses
    "mcp__playwright",
    "mcp__mercur",
    "mcp__medusa",
    "mcp__plugin_telegram_telegram__reply",
    "mcp__plugin_telegram_telegram__react",
    "mcp__plugin_telegram_telegram__edit_message",
    "mcp__plugin_telegram_telegram__download_attachment",
]

tool_rules = [
    # file and research tools: no prompts while the owner is away
    "Read",
    "Edit",
    "Write",
    "Glob",
    "Grep",
    "Skill",
    "ToolSearch",
    "Agent",
    "WebFetch",
    "WebSearch",
]

if mode == "bash":
    allow = bash_rules
elif mode == "playwright":
    allow = mcp_rules
elif mode == "tools":
    allow = tool_rules
else:
    allow = bash_rules + mcp_rules + tool_rules

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
