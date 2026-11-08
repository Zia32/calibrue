#!/usr/bin/env bash
# Copies the AI Dev Kit into a project without overwriting existing files.
# Usage: ./install.sh /path/to/project
set -euo pipefail

target="${1:-}"
if [ -z "$target" ] || [ ! -d "$target" ]; then
  echo "Usage: $0 /path/to/existing/project/folder" >&2
  exit 1
fi

kit="$(cd "$(dirname "$0")" && pwd)"
files=(
  CLAUDE.md
  docs/ARCHITECTURE.md
  docs/REVIEW_CHECKLIST.md
  docs/specs/_TEMPLATE.md
  .claude/settings.json
  .claude/hooks/guard-bash.sh
  .claude/skills/spec/SKILL.md
  .claude/skills/plan-feature/SKILL.md
  .claude/skills/review/SKILL.md
  .github/workflows/quality-gates.yml
  tests/_templates/guardrails.test.ts
)

for f in "${files[@]}"; do
  dest="$target/$f"
  if [ -e "$dest" ]; then
    echo "skip (exists): $f"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$kit/$f" "$dest"
    echo "added: $f"
  fi
done

chmod +x "$target/.claude/hooks/guard-bash.sh"
command -v jq >/dev/null || echo "WARNING: install jq, the guard hook needs it (brew install jq / apt install jq)"
echo "Done. Next: fill docs/ARCHITECTURE.md and the [brackets] in CLAUDE.md."
