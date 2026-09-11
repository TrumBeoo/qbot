#!/usr/bin/env bash
# Kiem tra hop dong 8 route auth cua API TypeScript.
#
# Muc dich khong phai do coverage ma la khoa HOP DONG: frontend hien tai
# doc {error: "..."}, doc user._id, va dua vao viec admin duoc uu tien
# truoc user khi dang nhap. Pha 05 cat sang API nay bang mot dong doi
# VITE_API_BASE_URL, nen lech hop dong la vo frontend.
#
# Chay:  ./test-auth.sh [base_url]
# Mac dinh http://localhost:4000
#
# Can: postgres dang chay. Admin duoc `pnpm test` seed san voi mat khau
# Admin123!; chay script nay truc tiep thi phai tu seed truoc, khong thi 5
# assert ve admin se fail vi mat khau khong khop:
#   ADMIN_PASSWORD=Admin123! pnpm seed:admin

set -uo pipefail

BASE="${1:-http://localhost:4000}"
AUTH="$BASE/api/auth"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@servicehub.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"

EMAIL="test-$(date +%s)-$$@example.test"
PASS="matkhau123"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

pass=0; fail=0

check() {
  local name="$1" want="$2"; shift 2
  local code
  code=$(curl -s -o "$TMP" -w "%{http_code}" "$@")
  if [ "$code" = "$want" ]; then
    pass=$((pass + 1)); printf '  ok   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf '  FAIL %s: mong %s, nhan %s\n       %s\n' "$name" "$want" "$code" "$(head -c 200 "$TMP")"
  fi
}

# Kiem mot field trong response cuoi cung
field() {
  local name="$1" expr="$2"
  if python3 -c "
import json,sys
d=json.load(open('$TMP'))
sys.exit(0 if ($expr) else 1)
" 2>/dev/null; then
    pass=$((pass + 1)); printf '  ok   %s\n' "$name"
  else
    fail=$((fail + 1)); printf '  FAIL %s\n       %s\n' "$name" "$(head -c 200 "$TMP")"
  fi
}

echo "Kiem tra $BASE"

check "health" 200 "$BASE/health"
field "health bao database up" "d['database']=='up'"

check "register" 201 -X POST "$AUTH/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Nguyen Test\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
# Hop dong: frontend doc user._id (ke thua tu MongoDB) va businessInfo
field "register tra _id" "len(d['user']['_id'])==36"
field "register tu dien businessInfo" "d['user']['businessInfo']['industry']=='Tourism'"
field "register KHONG tra password" "'password' not in d['user'] and 'passwordHash' not in d['user']"

check "register email trung -> 400" 400 -X POST "$AUTH/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"X\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
field "loi co hinh dang {error}" "'error' in d and isinstance(d['error'],str)"

check "mat khau < 6 ky tu -> 400" 400 -X POST "$AUTH/register" -H 'Content-Type: application/json' \
  -d '{"name":"X","email":"short@example.test","password":"abc"}'
check "email sai dinh dang -> 400" 400 -X POST "$AUTH/register" -H 'Content-Type: application/json' \
  -d '{"name":"X","email":"khong-phai-email","password":"matkhau123"}'

check "login" 200 -X POST "$AUTH/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
# Bug da tung xay ra: tra ve object doc TRUOC khi update nen last_login luon null
field "login cap nhat last_login" "d['user']['last_login'] is not None"
TOKEN=$(python3 -c "import json;print(json.load(open('$TMP'))['token'])" 2>/dev/null || echo '')

check "login sai mat khau -> 401" 401 -X POST "$AUTH/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"sai-mat-khau\"}"
check "login email khong ton tai -> 401" 401 -X POST "$AUTH/login" -H 'Content-Type: application/json' \
  -d '{"email":"khong-ton-tai@example.test","password":"matkhau123"}'

check "admin login" 200 -X POST "$AUTH/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
# Admin phai duoc thu TRUOC user: Dashboard dua vao thu tu nay
field "admin login noi 'Admin login successful'" "d['message']=='Admin login successful'"
field "admin co role" "d['user']['role']=='admin'"
ADMIN_TOKEN=$(python3 -c "import json;print(json.load(open('$TMP'))['token'])" 2>/dev/null || echo '')

check "verify-token qua header" 200 -X POST "$AUTH/verify-token" -H "Authorization: Bearer $TOKEN"
field "user_type la user" "d['user_type']=='user' and d['valid'] is True"
check "verify-token qua body" 200 -X POST "$AUTH/verify-token" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\"}"
check "verify-token cua admin" 200 -X POST "$AUTH/verify-token" -H "Authorization: Bearer $ADMIN_TOKEN"
field "user_type la admin" "d['user_type']=='admin'"
check "verify-token rac -> 401" 401 -X POST "$AUTH/verify-token" -H "Authorization: Bearer khong-hop-le"

check "GET profile" 200 "$AUTH/profile" -H "Authorization: Bearer $TOKEN"
check "GET profile khong token -> 401" 401 "$AUTH/profile"
field "loi thieu token noi ro" "d['error']=='Token is missing'"

check "PUT profile" 200 -X PUT "$AUTH/profile" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Ten Da Doi"}'
field "PUT profile doi ten that" "d['user']['name']=='Ten Da Doi'"

# Leo quyen: client gui field khong khai bao trong DTO. ValidationPipe
# whitelist phai bo chung, khong duoc ghi vao DB.
check "PUT profile voi field la" 200 -X PUT "$AUTH/profile" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Ten Khac","isActive":false,"permissions":{"all":["write"]}}'
check "tai khoan van active sau do" 200 "$AUTH/profile" -H "Authorization: Bearer $TOKEN"
field "isActive KHONG bi client ghi de" "d['user']['is_active'] is True"

check "logout" 200 -X POST "$AUTH/logout"

check "google-login chua cau hinh -> 401" 401 -X POST "$AUTH/google-login" \
  -H 'Content-Type: application/json' -d '{"token":"gia"}'
check "facebook-login chua cau hinh -> 401" 401 -X POST "$AUTH/facebook-login" \
  -H 'Content-Type: application/json' -d '{"token":"gia"}'

echo
echo "$pass pass, $fail fail"
[ "$fail" -eq 0 ] || exit 1
