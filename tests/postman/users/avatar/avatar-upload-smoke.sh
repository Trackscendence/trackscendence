#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
DEFAULT_FILE_PATH="$ROOT_DIR/tests/postman/users/avatar/fixtures/avatar-valid.png"
FILE_PATH="${1:-$DEFAULT_FILE_PATH}"
BASE_URL="${2:-http://localhost:8080}"
BASE_URL="${BASE_URL%/}"
API_BASE_URL="$BASE_URL/api/v1"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to run this script." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to parse API responses in this script." >&2
  exit 1
fi

if [[ ! -f "$FILE_PATH" ]]; then
  echo "Avatar fixture not found: $FILE_PATH" >&2
  exit 1
fi

RUN_ID="$(date +%s)"
USERNAME_SUFFIX="${RUN_ID: -8}"
EMAIL="avatar.smoke.${RUN_ID}@example.com"
USERNAME="avatarsmoke${USERNAME_SUFFIX}"
PASSWORD="Start123!"

RESPONSE_BODY=''
RESPONSE_STATUS=''
CURRENT_STEP=''

if [[ -t 1 || -t 2 ]]; then
  COLOR_GREEN=$'\033[32m'
  COLOR_RED=$'\033[31m'
  COLOR_RESET=$'\033[0m'
else
  COLOR_GREEN=''
  COLOR_RED=''
  COLOR_RESET=''
fi

on_exit() {
  local exit_code="$1"

  if [[ "$exit_code" -eq 0 ]]; then
    printf '\n%sPASS: Avatar upload smoke check passed%s\n' \
      "$COLOR_GREEN" \
      "$COLOR_RESET"
    return
  fi

  printf '\n%sFAIL: Avatar upload smoke check failed%s\n' \
    "$COLOR_RED" \
    "$COLOR_RESET" >&2
  if [[ -n "$CURRENT_STEP" ]]; then
    printf 'Last step: %s\n' "$CURRENT_STEP" >&2
  fi
}

trap 'on_exit "$?"' EXIT

print_step() {
  CURRENT_STEP="$1"
  printf '\n==> %s\n' "$1"
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

request_json() {
  local method="$1"
  local url="$2"
  local payload="${3:-}"
  local token="${4:-}"
  local response
  local curl_args=(
    -sS
    -X "$method"
    -H 'Accept: application/json'
    -H 'Content-Type: application/json'
  )

  if [[ -n "$token" ]]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi

  if [[ -n "$payload" ]]; then
    curl_args+=(--data "$payload")
  fi

  response="$(curl "${curl_args[@]}" "$url" -w $'\n%{http_code}')"
  RESPONSE_STATUS="${response##*$'\n'}"
  RESPONSE_BODY="${response%$'\n'*}"
}

request_form() {
  local method="$1"
  local url="$2"
  local file_path="$3"
  local token="$4"
  local response

  response="$(
    curl -sS \
      -X "$method" \
      -H 'Accept: application/json' \
      -H "Authorization: Bearer $token" \
      -F "avatar=@${file_path}" \
      "$url" \
      -w $'\n%{http_code}'
  )"

  RESPONSE_STATUS="${response##*$'\n'}"
  RESPONSE_BODY="${response%$'\n'*}"
}

assert_status() {
  local expected="$1"

  if [[ "$RESPONSE_STATUS" != "$expected" ]]; then
    echo "Unexpected status: got $RESPONSE_STATUS, expected $expected" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
  fi
}

json_get() {
  local expression="$1"

  printf '%s' "$RESPONSE_BODY" | node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(0, 'utf8'));
    const value = (${expression});
    if (value === undefined) process.exit(2);
    process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value));
  "
}

assert_json_equals() {
  local expression="$1"
  local expected="$2"
  local actual

  actual="$(json_get "$expression")"
  if [[ "$actual" != "$expected" ]]; then
    fail "JSON assertion failed for ${expression}: expected '${expected}', got '${actual}'"
  fi
}

assert_avatar_asset_reachable() {
  local avatar_url="$1"
  local asset_url=''
  local asset_status=''

  case "$avatar_url" in
    http://*|https://*)
      asset_url="$avatar_url"
      ;;
    /*)
      asset_url="${BASE_URL}${avatar_url}"
      ;;
    *)
      fail "Unexpected avatar URL format: $avatar_url"
      ;;
  esac

  asset_status="$(curl -sS -o /dev/null -w '%{http_code}' "$asset_url")"

  if [[ "$asset_status" != '200' ]]; then
    fail "Uploaded avatar is not reachable at ${asset_url} (status ${asset_status})"
  fi
}

print_step "Register test user"
request_json \
  POST \
  "$API_BASE_URL/auth/register" \
  "$(printf '{"email":"%s","username":"%s","password":"%s"}' "$EMAIL" "$USERNAME" "$PASSWORD")"
assert_status 201
assert_json_equals 'data.user.email' "$EMAIL"
assert_json_equals 'data.user.username' "$USERNAME"

print_step "Login test user"
request_json \
  POST \
  "$API_BASE_URL/auth/login" \
  "$(printf '{"identifier":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")"
assert_status 200
TOKEN="$(json_get 'data.token')"
[[ -n "$TOKEN" ]] || fail 'Login did not return a bearer token'

print_step "Upload avatar with curl multipart/form-data"
request_form POST "$API_BASE_URL/users/me/avatar" "$FILE_PATH" "$TOKEN"
assert_status 200
AVATAR_URL="$(json_get 'data.user.avatarUrl')"
[[ -n "$AVATAR_URL" && "$AVATAR_URL" != 'null' ]] || fail 'Avatar upload did not return avatarUrl'

print_step "Verify auth/me reflects the uploaded avatar"
request_json GET "$API_BASE_URL/auth/me" '' "$TOKEN"
assert_status 200
assert_json_equals 'data.user.avatarUrl' "$AVATAR_URL"

print_step "Verify public profile reflects the uploaded avatar"
request_json GET "$API_BASE_URL/users/$USERNAME"
assert_status 200
assert_json_equals 'data.user.avatarUrl' "$AVATAR_URL"

print_step "Verify the avatar asset is reachable"
assert_avatar_asset_reachable "$AVATAR_URL"

print_step "Delete avatar"
request_json DELETE "$API_BASE_URL/users/me/avatar" '' "$TOKEN"
assert_status 200
assert_json_equals 'data.user.avatarUrl' 'null'

print_step "Smoke check complete"
printf 'Uploaded avatar path was: %s\n' "$AVATAR_URL"
