#!/usr/bin/env bash
# Kiem tra hop dong nhom hoi thoai + tin nhan.
#
# Hai dieu bo test nay khoa lai:
#   1. Hinh dang {status:'success', data:...} - mysqlConversationService.js
#      kiem `data.status === 'success'`, va tin nhan phai co field
#      "timestamp" (khong phai createdAt).
#   2. Cach ly theo nguoi dung. Ban Flask co cho chi loc theo
#      conversation_id, nen ai biet id la doc duoc hoi thoai cua nguoi khac.
#
# Chay: ./test-chat.sh [base_url]

set -uo pipefail
BASE="${1:-http://localhost:4000}"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
pass=0; fail=0

check() {
  local name="$1" want="$2"; shift 2
  local code; code=$(curl -s -o "$TMP" -w "%{http_code}" "$@")
  if [ "$code" = "$want" ]; then pass=$((pass+1)); printf '  ok   %s\n' "$name"
  else fail=$((fail+1)); printf '  FAIL %s: mong %s nhan %s\n       %s\n' "$name" "$want" "$code" "$(head -c 200 "$TMP")"; fi
}
field() {
  local name="$1" expr="$2"
  if python3 -c "
import json,sys
d=json.load(open('$TMP'))
sys.exit(0 if ($expr) else 1)" 2>/dev/null; then
    pass=$((pass+1)); printf '  ok   %s\n' "$name"
  else fail=$((fail+1)); printf '  FAIL %s\n       %s\n' "$name" "$(head -c 250 "$TMP")"; fi
}
tok() { python3 -c "import json;print(json.load(open('$TMP'))['token'])"; }
dget() { python3 -c "import json;print(json.load(open('$TMP'))['data']$1)"; }

reg() { # email -> token
  curl -s -o "$TMP" -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
    -d "{\"name\":\"T\",\"email\":\"$1\",\"password\":\"matkhau123\"}" >/dev/null
  tok
}

S=$(date +%s)-$$
A_TOK=$(reg "chat-a-$S@example.test")
B_TOK=$(reg "chat-b-$S@example.test")
AH="Authorization: Bearer $A_TOK"
BH="Authorization: Bearer $B_TOK"
JS='Content-Type: application/json'

echo "Kiem tra $BASE (nhom hoi thoai)"

check "khong token -> 401" 401 "$BASE/api/chat/conversations"

check "tao hoi thoai rong" 201 -X POST "$BASE/api/chat/conversations" -H "$AH" -H "$JS" -d '{"title":"Chuyen di Ha Long"}'
field "hinh dang {status:success}" "d['status']=='success'"
field "title dung" "d['data']['title']=='Chuyen di Ha Long'"
field "message_count = 0" "d['data']['message_count']==0"
field "co user_id" "len(d['data']['user_id'])==36"
CID=$(dget "['id']")

check "tao hoi thoai kem tin nhan dau" 201 -X POST "$BASE/api/chat/conversations" -H "$AH" -H "$JS" \
  -d '{"user_message":"Vinh Ha Long co gi hay khong ban oi cho minh biet voi nhe","bot_response":"Vinh Ha Long la di san UNESCO"}'
field "co 2 tin nhan" "len(d['data']['messages'])==2"
field "tieu de sinh tu tin nhan dau, cat 50 ky tu" "d['data']['title'].endswith('...') and len(d['data']['title'])==53"
field "tin nhan co field timestamp (khong phai createdAt)" "'timestamp' in d['data']['messages'][0] and 'createdAt' not in d['data']['messages'][0]"
field "tin nhan co conversation_id" "d['data']['messages'][0]['conversation_id']==d['data']['id']"
CID2=$(dget "['id']")

check "liet ke hoi thoai" 200 "$BASE/api/chat/conversations" -H "$AH"
field "thay ca 2 hoi thoai" "len(d['data'])==2"
field "moi nhat len dau" "d['data'][0]['id']=='$CID2'"

check "doc mot hoi thoai" 200 "$BASE/api/chat/conversations/$CID2" -H "$AH"
field "co kem tin nhan" "len(d['data']['messages'])==2"

check "them tin nhan" 201 -X POST "$BASE/api/chat/conversations/$CID/messages" -H "$AH" -H "$JS" \
  -d '{"text":"Con khach san thi sao?","sender":"user"}'
field "sender dung" "d['data']['sender']=='user'"
field "language mac dinh vi" "d['data']['language']=='vi'"
MID=$(dget "['id']")

check "sender la -> 400" 400 -X POST "$BASE/api/chat/conversations/$CID/messages" -H "$AH" -H "$JS" \
  -d '{"text":"x","sender":"assistant"}'
check "text rong -> 400" 400 -X POST "$BASE/api/chat/conversations/$CID/messages" -H "$AH" -H "$JS" \
  -d '{"text":"","sender":"user"}'

# Them tin nhan phai day hoi thoai len dau danh sach
check "hoi thoai vua them tin nhan len dau" 200 "$BASE/api/chat/conversations" -H "$AH"
field "thu tu cap nhat theo updatedAt" "d['data'][0]['id']=='$CID'"

check "doi ten hoi thoai" 200 -X PUT "$BASE/api/chat/conversations/$CID" -H "$AH" -H "$JS" -d '{"title":"Ten Moi"}'
field "ten da doi" "d['data']['title']=='Ten Moi'"
check "doi ten rong -> 400" 400 -X PUT "$BASE/api/chat/conversations/$CID" -H "$AH" -H "$JS" -d '{"title":""}'

check "tim kiem" 200 "$BASE/api/chat/search?q=khach%20san" -H "$AH"
field "tim thay theo noi dung tin nhan" "len(d['data'])>=1"
check "tim kiem thieu q -> 400" 400 "$BASE/api/chat/search" -H "$AH"

check "thong ke" 200 "$BASE/api/chat/stats" -H "$AH"
field "dem dung" "d['data']['total_conversations']==2 and d['data']['total_messages']==3"
field "tach user/bot" "d['data']['user_messages']==2 and d['data']['bot_messages']==1"

check "export" 200 "$BASE/api/chat/export" -H "$AH"
field "export co kem tin nhan" "all('messages' in c for c in d['data'])"

# --- Cach ly nguoi dung: day la cho ban cu tung ho ---
check "user B khong doc duoc hoi thoai cua A -> 404" 404 "$BASE/api/chat/conversations/$CID" -H "$BH"
check "user B khong doi ten duoc -> 404" 404 -X PUT "$BASE/api/chat/conversations/$CID" -H "$BH" -H "$JS" -d '{"title":"Chiem"}'
check "user B khong xoa duoc -> 404" 404 -X DELETE "$BASE/api/chat/conversations/$CID" -H "$BH"
check "user B khong them tin nhan duoc -> 404" 404 -X POST "$BASE/api/chat/conversations/$CID/messages" -H "$BH" -H "$JS" -d '{"text":"x","sender":"user"}'
check "danh sach cua B rong" 200 "$BASE/api/chat/conversations" -H "$BH"
field "B khong thay gi cua A" "len(d['data'])==0"

# --- Ca hai prefix phai tra cung ket qua ---
check "prefix /api/mysql-chat cung hoat dong" 200 "$BASE/api/mysql-chat/conversations" -H "$AH"
field "mysql-chat tra cung so hoi thoai" "len(d['data'])==2"

check "xoa tin nhan" 200 -X DELETE "$BASE/api/chat/conversations/$CID/messages/$MID" -H "$AH"
check "xoa tin nhan khong thuoc hoi thoai -> 404" 404 -X DELETE "$BASE/api/chat/conversations/$CID2/messages/$MID" -H "$AH"

check "id khong phai uuid -> 400" 400 "$BASE/api/chat/conversations/khong-phai-uuid" -H "$AH"
check "id uuid nhung khong ton tai -> 404" 404 "$BASE/api/chat/conversations/00000000-0000-0000-0000-000000000000" -H "$AH"

# --- Cascade: xoa hoi thoai phai keo theo tin nhan ---
check "xoa hoi thoai" 200 -X DELETE "$BASE/api/chat/conversations/$CID2" -H "$AH"
check "doc lai -> 404" 404 "$BASE/api/chat/conversations/$CID2" -H "$AH"
check "thong ke sau khi xoa" 200 "$BASE/api/chat/stats" -H "$AH"
field "tin nhan cua hoi thoai da xoa cung bien mat" "d['data']['total_conversations']==1 and d['data']['total_messages']==0"

echo
echo "$pass pass, $fail fail"
[ "$fail" -eq 0 ] || exit 1
