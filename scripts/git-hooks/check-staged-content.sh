#!/usr/bin/env sh
# Pre-commit guard: reject staged filenames or file content that reference AI
# tooling. Keeps the repository clean of anything an evaluator could read as
# proof the work was AI-assisted.
set -eu

HOOK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$HOOK_DIR/ai-identifier-patterns.sh"

# Files that legitimately contain these words (the guard itself). Anything
# under scripts/git-hooks/ is exempt so the deny-list does not flag itself.
SELF_PREFIX='scripts/git-hooks/'

staged=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$staged" ] && exit 0

status=0

# 1) Filenames
bad_names=$(printf '%s\n' "$staged" | grep -viE "^$SELF_PREFIX" | grep -iE "$AI_FILENAME_REGEX" || true)
if [ -n "$bad_names" ]; then
  echo "✖ Blocked: staged filename references AI tooling:"
  printf '  %s\n' $bad_names
  status=1
fi

# 2) Content of each staged file (the version being committed)
for file in $staged; do
  case "$file" in
    "$SELF_PREFIX"*) continue ;;
  esac
  # Only text blobs; skip anything git can't show as text.
  match=$(git show ":$file" 2>/dev/null | grep -inE "$AI_IDENTIFIER_REGEX" || true)
  if [ -n "$match" ]; then
    echo "✖ Blocked: $file references AI tooling:"
    printf '%s\n' "$match" | sed 's/^/    /'
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo ""
  echo "Remove the reference(s) above, then re-stage and commit."
  echo "This guard exists because such references can fail the project evaluation."
fi

exit "$status"
