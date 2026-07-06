#!/usr/bin/env sh
# commit-msg guard: reject commit messages, trailers, or author/committer
# identity that reference AI tooling (e.g. "Co-authored-by: ... AI",
# "Generated with Claude", a Copilot/Codex author).
set -eu

MSG_FILE=$1

HOOK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$HOOK_DIR/ai-identifier-patterns.sh"

status=0

# 1) Message body + trailers (ignore scissors/comment lines git adds)
msg=$(grep -v '^#' "$MSG_FILE" || true)
msg_hit=$(printf '%s\n' "$msg" | grep -inE "$AI_IDENTIFIER_REGEX" || true)
if [ -n "$msg_hit" ]; then
  echo "✖ Blocked: commit message references AI tooling:"
  printf '%s\n' "$msg_hit" | sed 's/^/    /'
  status=1
fi

# 2) Author / committer identity
author=$(git var GIT_AUTHOR_IDENT 2>/dev/null || true)
committer=$(git var GIT_COMMITTER_IDENT 2>/dev/null || true)
ident_hit=$(printf '%s\n%s\n' "$author" "$committer" | grep -iE "$AI_IDENTITY_REGEX" || true)
if [ -n "$ident_hit" ]; then
  echo "✖ Blocked: commit author/committer references AI tooling:"
  printf '%s\n' "$ident_hit" | sed 's/^/    /'
  status=1
fi

if [ "$status" -ne 0 ]; then
  echo ""
  echo "Rewrite the message/trailers and use a human identity, then commit again."
  echo "This guard exists because such references can fail the project evaluation."
fi

exit "$status"
