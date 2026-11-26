#!/usr/bin/env bash
# Set NEXT_PUBLIC_SITE_NAME to the Koi Auction House brand in the dev env files.
# Run manually from the repo root:  bash scripts/set-site-name.sh
# It never prints any .env content — only whether each file was changed.
set -euo pipefail

cd "$(dirname "$0")/.."

python3 -I - <<'PY'
import pathlib
import re

value = '"Koi Auction House"'
files = [
    pathlib.Path("apps/storefront-koi/.env"),
    pathlib.Path("apps/admin-koi/.env"),
]
changed = []
for path in files:
    if not path.exists():
        print(f"skip   {path} (missing)")
        continue
    text = path.read_text()
    new = re.sub(
        r"(?m)^NEXT_PUBLIC_SITE_NAME=.*$",
        f"NEXT_PUBLIC_SITE_NAME={value}",
        text,
    )
    if new == text and "NEXT_PUBLIC_SITE_NAME=" not in text:
        new = text + ("" if text.endswith("\n") else "\n") + f"NEXT_PUBLIC_SITE_NAME={value}\n"
    if new != text:
        path.write_text(new)
        changed.append(str(path))
        print(f"update {path}")
    else:
        print(f"ok     {path} already set")
print("done. restart the dev stack so the change takes effect.")
PY
