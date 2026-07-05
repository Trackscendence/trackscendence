#!/usr/bin/env sh
# CI guard (server-side, cannot be bypassed with --no-verify): scan the whole
# tracked tree — filenames and file content — and, when given a commit range,
# every commit message plus author/committer identity in that range.
#
# Usage:
#   scan-repository.sh                 # scan the current tree only
#   scan-repository.sh <base>..<head>  # also scan commit messages in the range
set -eu

HOOK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$HOOK_DIR/ai-identifier-patterns.sh"

# The deny-list itself lives here, so exempt it from the scan.
SELF_PREFIX='scripts/git-hooks/'
RANGE="${1:-}"
status=0

files=$(git ls-files | grep -viE "^$SELF_PREFIX" || true)

# 1) Filenames
bad_names=$(printf '%s\n' "$files" | grep -iE "$AI_FILENAME_REGEX" || true)
if [ -n "$bad_names" ]; then
  echo "✖ Filename(s) reference AI tooling:"
  printf '  %s\n' $bad_names
  status=1
fi

# 2) File content (-I skips binary blobs like images)
for file in $files; do
  match=$(grep -InE "$AI_IDENTIFIER_REGEX" "$file" 2>/dev/null || true)
  if [ -n "$match" ]; then
    echo "✖ $file references AI tooling:"
    printf '%s\n' "$match" | sed 's/^/    /'
    status=1
  fi
done

# 3) Every commit in the range: message + identity, AND the lines it ADDS.
#    Scanning added lines per commit catches content that was introduced and
#    then deleted later in the same range (the final tree wouldn't show it, but
#    it still lives in a history blob).
if [ -n "$RANGE" ]; then
  for sha in $(git rev-list "$RANGE"); do
    meta=$(git log -1 --format='%B%n%an <%ae>%n%cn <%ce>' "$sha")
    hit=$(printf '%s\n' "$meta" | grep -inE "$AI_IDENTIFIER_REGEX|$AI_IDENTITY_REGEX" || true)
    if [ -n "$hit" ]; then
      echo "✖ commit $sha references AI tooling (message/identity):"
      printf '%s\n' "$hit" | sed 's/^/    /'
      status=1
    fi

    added=$(git show "$sha" --format= --unified=0 -- . ':!scripts/git-hooks' 2>/dev/null \
      | grep -E '^\+' | grep -vE '^\+\+\+ ' | grep -inE "$AI_IDENTIFIER_REGEX" || true)
    if [ -n "$added" ]; then
      echo "✖ commit $sha adds content referencing AI tooling:"
      printf '%s\n' "$added" | sed 's/^/    /'
      status=1
    fi
  done
fi

if [ "$status" -ne 0 ]; then
  echo ""
  echo "The repository must not reference AI tooling anywhere — it can fail the evaluation."
  exit 1
fi

echo "✓ No AI-tooling references found."
