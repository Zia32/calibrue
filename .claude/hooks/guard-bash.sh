#!/usr/bin/env bash
# Blocks destructive shell commands before Claude Code runs them.
# Exit 2 = block (stderr is shown to Claude as the reason). Exit 0 = allow.
# To run one of these yourself, run it in your own terminal, not through the AI.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

lower=$(printf '%s' "$cmd" | tr '[:upper:]' '[:lower:]')

block() {
  echo "BLOCKED by project guard: $1. Show the user the exact command and ask them to run it themselves if it is really needed." >&2
  exit 2
}

case "$lower" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf ."*|*"rm -rf *"*) block "recursive delete" ;;
  *"git push --force"*|*"git push -f"*|*"--force-with-lease"*) block "force push" ;;
  *"git reset --hard"*|*"git clean -fd"*) block "discards uncommitted work" ;;
  *"drop table"*|*"drop database"*|*"drop schema"*|*"truncate "*) block "destructive SQL" ;;
  *"delete from"*)
    # DELETE without WHERE wipes the table
    printf '%s' "$lower" | grep -q "where" || block "DELETE without WHERE" ;;
  *"migrate reset"*|*"db reset"*|*"migrate:fresh"*|*"migrate:reset"*|*"db push --force-reset"*|*"--accept-data-loss"*) block "database reset" ;;
esac

# Never let the AI touch production
case "$lower" in
  *"prod"*"database_url"*|*"database_url"*"prod"*|*"--env=production"*|*"--env production"*|*"node_env=production"*"migrate"*)
    block "command targets production" ;;
esac

exit 0
