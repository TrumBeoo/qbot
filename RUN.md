# Cách chạy project (Linux)

Bản này thay cho phần "Cách chạy" trong `README.md` — README cũ đã lạc hậu
(`backend/nhap.py`, `frontend/`, `start_servers.bat` đều không còn tồn tại).

## 3 service, 3 port

| Thư mục     | Là gì                  | Port | Lệnh chạy      |
|-------------|------------------------|------|----------------|
| `be/`       | Flask API (`app.py`)   | 5555 | `python app.py`|
| `fe/`       | Chat UI (React + Vite) | 3000 | `npm run dev`  |
| `Dashboard/`| Admin UI (React + Vite)| 5173 | `npm run dev`  |

`NULL/` là code cũ/nháp — bỏ qua. `backend/` và `frontend/` đã được đổi tên
thành `be/` và `fe/` nhưng **chưa commit** (`git status` đang thấy rename này).

## Trạng thái hiện tại của máy

Backend đã dựng xong và boot thật thành công. Đã làm:

- `be/.venv` tạo xong, cài đủ dependency (numpy 2.3.1, torch 2.8.0+cpu)
- `be/requirements.txt` đã sửa để cài được
- `.env` + `.env.example` cho cả 3 project
- MySQL 8 và MongoDB 7 chạy trong docker (`qbot-mysql`, `qbot-mongo`)
- Tài khoản admin đã tạo trong Mongo
- Verify sống: `/health`, `/datetime`, `/rag-stats` (20 documents)

**Còn đúng 1 việc:** điền `GROQ_API_KEY` vào `be/.env`. Thiếu key thì
`/chat` vẫn trả HTTP 200 nhưng nội dung là câu xin lỗi "đang gặp vấn đề kỹ
thuật", còn log server ghi
`Failed to initialize LLM: GROQ_API_KEY environment variable is required`.
Đừng mất thời gian debug chỗ khác khi thấy câu đó.

Chưa làm: `npm install` cho `fe/` và `Dashboard/`.

---

## 0. Chay bang Docker (khuyen dung)

Pha 01 cua lo trinh chuyen doi da xong: toan bo stack chay bang
`docker compose`. Day la cach nhanh nhat, khong can cai Python hay Node tren
may.

```bash
cd ~/Code/qbot
docker compose up -d --build      # lan dau: ~10 phut, anh be nang 2.43GB
docker compose logs -f be
```

| Service | Cong | Ghi chu |
|---|---|---|
| `be` | 5555 | Flask + RAG |
| `fe` | 3000 | Chat UI, nginx phuc vu ban build |
| `dashboard` | 5173 | Admin UI |
| `postgres` | 5432 | Chua dung, san cho pha 02 |
| `mysql` | 3306 | |
| `mongo` | 27017 | |

Truoc khi `up`, dung cac tien trinh dang giu port tren host: vite dev server
(3000, 5173), flask (5555), va container tao bang tay truoc do.

Secret khong bi nhan doi: compose doc truc tiep `be/.env` qua `env_file`, chi
ghi de nhung gia tri phu thuoc container (`MYSQL_HOST=mysql`,
`MONGO_URI=mongodb://mongo:27017/`, `CORS_ORIGINS`, `PORT`, `FLASK_DEBUG=0`).
`.env` o thu muc goc la tuy chon, chi de override cap compose - xem
`.env.example`.

### Ba cho da phai chua trong pha nay

**Uid cua container phai khop uid host.** `be/vectorstore/` va
`be/static/images/` la bind mount nen file mang ownership host (uid 1000).
Ban dau image chay uid 10001 va RAG chet voi
`could not open vectorstore/index/index.faiss for writing: Permission denied`.
Da doi thanh build arg `APP_UID`/`APP_GID`, mac dinh 1000. May ban khac 1000
thi dat `DOCKER_UID` trong `.env` goc - xem bang `id -u`.

**Named volume giu ownership tu lan tao dau.** Neu ban tung build voi uid khac
roi doi, volume `qbot_hfcache` van thuoc uid cu. Chua ma khong phai tai lai
model 519MB:

```bash
docker run --rm -v qbot_hfcache:/c alpine:3 chown -R 1000:1000 /c
docker compose restart be
```

**Bien `VITE_*` nhung vao bundle luc BUILD.** Doi URL API thi phai
`docker compose build fe dashboard` lai, restart khong co tac dung.

### Vi sao co volume cho tung thu

- `hfcache` — model embedding nang 519MB. Khong cache la moi container moi
  tai lai. Co cache thi `docker compose restart be` len trong 4 giay.
- `./be/vectorstore` (bind mount, khong phai named volume) — dung luon FAISS
  index da build san tren host. Cung nho vay ma index build trong container
  ghi nguoc ra host.
- `./be/static/images` — anh upload tu Dashboard phai song qua rebuild.
- `pgdata`, `mysqldata`, `mongodata` — du lieu database.

### Lenh hay dung

```bash
docker compose ps                       # trang thai + healthcheck
docker compose logs -f be               # log backend
docker compose restart be               # sau khi sua .env
docker compose build be && docker compose up -d be   # sau khi sua code Python
docker compose down                     # dung, giu du lieu
docker compose down -v                  # dung va XOA het volume
```

Ca 6 service deu co healthcheck, nen `docker compose ps` bao `healthy` la
that su phuc vu duoc, khong chi la process con song.

---

## 0b. Chay truc tiep tren may (khong Docker)

### Bootstrap (máy này còn thiếu)

Python 3.12.3 có sẵn nhưng thiếu `pip` và `venv`:

```bash
sudo apt install python3-pip python3.12-venv
```

Node 24 + npm 11 đã có sẵn, không cần làm gì.

MongoDB và MySQL **không được cài trên máy này**. Xem mục 2 để chọn cách xử lý.

---

## 0c. Postgres + Prisma (pha 02)

Schema Postgres da xong va da co migration chay duoc. Chua co code API -
do la pha 04.

```bash
cd api
npm install
cp .env.example .env          # DATABASE_URL tro localhost:5432
npx prisma migrate deploy     # ap dung 3 migration
npm run smoke                 # kiem tra schema bang assert that
```

`postgres` phai dang chay truoc (`docker compose up -d postgres`).

**DATABASE_URL co hai gia tri khac nhau.** Chay `prisma` tu may host thi
dung `@localhost:5432`; chay trong container thi phai la `@postgres:5432`
(ten service trong compose). Dat sai la bao `ECONNREFUSED`.

### 7 bang, khong phai 8

Ke hoach ban dau uoc 8 thuc the. Dem lai thi la 7: `memory_service.py`
khong ghi xuong DB nao ca, no chi giu trong bo nho, nen khong sinh ra bang.

| Bang | Tu dau | Ghi chu |
|---|---|---|
| `users` | Mongo `users` | `businessInfo` va `permissions` giu `jsonb` |
| `admins` | Mongo `admins` | Bo cot `password_salt` |
| `conversations` | MySQL | Co khoa ngoai thuc su tro tới `users` |
| `messages` | MySQL | `timestamp` doi ten thanh `createdAt` |
| `locations` | MySQL | |
| `location_images` | MySQL | |
| `data_files` | Mongo `data` | Tai lieu nguon cho RAG |

Mongo `chat_history` khong thanh bang: hinh dang quan he cua MySQL duoc
chon lam chuan, hinh dang document bo hoan toan.

### Bon thu sua vi DB dang trong

- **`uuid` native** thay `VARCHAR(36)`, va id do DB sinh chu khong phai app.
- **Khoa ngoai that.** `conversations.user_id` cu la `VARCHAR(36)` khong
  rang buoc, ghi duoc hoi thoai tro tới user khong ton tai. Smoke test co
  assert cho dieu nay.
- **`timestamptz` cho moi cot thoi gian.** Code cu luu naive UTC bang
  `datetime.utcnow()` roi render theo `Asia/Ho_Chi_Minh` - chi dung neu moi
  nguoi cung ngam hieu cot do la UTC. `timestamptz` bo cai ngam hieu di.
- **GIN trigram index** cho tim kiem dia diem. Truy van thuc te la
  `LOWER(name) LIKE '%tu khoa%'`; index `FULLTEXT` cua MySQL chi phuc vu
  `MATCH ... AGAINST` nen chua tung duoc dung tới. Index moi dat tren
  `lower(cot)` de khop dung bieu thuc - `EXPLAIN` xac nhan planner dung no.

### Khi doi schema

```bash
cd api
# sua prisma/schema.prisma roi:
npx prisma migrate dev --name mo_ta_ngan
npm run smoke
```

Migration `trigram_indexes_for_like_search` la SQL viet tay (Prisma khong
dien dat duoc index tren bieu thuc). `prisma migrate dev` khong sinh lai no,
nhung neu ban doi ten cot `name` / `nameEn` / `keywords` thi phai sua file
SQL do bang tay.

---

## 0d. AI service (pha 03)

Phan AI da tach thanh service rieng `ai/`, chay FastAPI. Service NOI BO:
khong publish port ra host, chi goi duoc tu trong mang cua compose.

```bash
docker compose up -d --build ai
docker compose logs -f ai
```

Thu tay (token lay tu `.env` o thu muc goc):

```bash
T=$(grep '^AI_SERVICE_TOKEN=' .env | cut -d= -f2)
docker compose exec -T be curl -s -H "Authorization: Bearer $T" http://ai:8000/rag/stats
```

### Sau endpoint

| Endpoint | Lam gi |
|---|---|
| `POST /rag/answer` | Tra loi qua RAG. `without_rag: true` thi goi Groq truc tiep |
| `POST /rag/search` | Tim doan tai lieu gan nhat, khong goi LLM |
| `POST /rag/reindex` | Build lai vectorstore tu `data/` |
| `POST /tts` | edge-tts sinh giong noi, tra base64 |
| `POST /detect-language` | Nhan dien vi/en |
| `POST /summarize` | Tom tat hoi thoai + rut tu khoa |

Them `GET /health` (khong can token, cho docker healthcheck) va
`GET /rag/stats`.

### Ranh gioi: service khong doc database

Day la dieu quan trong nhat cua pha nay. AI service khong biet Postgres,
MySQL hay Mongo ton tai. Lich su hoi thoai duoc API nap roi **truyen vao
trong request**:

```json
POST /rag/answer
{
  "question": "Con khach san thi sao?",
  "history": [
    {"sender": "user", "text": "Toi muon di Bai Chay 3 ngay"},
    {"sender": "bot",  "text": "Bai Chay o Ha Long, co bai bien..."}
  ]
}
```

Giu duoc ranh gioi nay thi doi store, scale rieng, hay thay han service deu
de. Da kiem chung: cau hoi khong nhac Bai Chay nhung bot van tra loi dung
nho `history`.

### Cai gi vao ai/, cai gi khong

`be/RAG/` va `be/config/noi.py` **khong cham database dong nao** nen chuyen
sang nguyen trang (`ai/rag/`, `ai/voice.py`), chi sua duong dan import va bo
mot dong `from flask import jsonify` chua tung duoc dung.

Ba module KHONG vao AI service vi chung la dieu phoi DB, khong phai AI:

- `services/mongodb_rag_service.py` (221 dong) - noi lich su Mongo voi RAG
- `services/enhanced_rag_service.py` (472 dong) - phu thuoc memory_service
- `services/memory_service.py` (561 dong) - hien thuc mot langchain
  `BaseChatMessageHistory` doc/ghi truc tiep MySQL

Phan AI thuc su cua `memory_service` duoc viet lai thanh `ai/summarize.py`
(~130 dong) nhan messages tu request. Cac ham `get_user_preferences`,
`get_memory_stats`, `cleanup_old_memories` la truy van DB - viec cua API o
pha 04.

`ai/summarize.py` co self-check chay duoc:

```bash
docker compose exec -T ai python summarize.py     # in "summarize demo OK"
```

### Xac thuc

Token dung chung qua `AI_SERVICE_TOKEN`, so sanh bang
`secrets.compare_digest`. **Khong dat bien nay la service tu choi moi
request** (503) - mac dinh mo cua la kieu loi de xay ra khi deploy. Da kiem
chung: thieu token -> 401, token sai -> 401.

### Volume

- `./be/data:/app/data:ro` - **chi doc**. AI service khong sua tai lieu
  nguon, no chi doc de build index. Sua noi dung la viec cua API.
- `./be/vectorstore:/app/vectorstore` - ghi duoc, `/rag/reindex` build lai
  index vao day.
- `hfcache` - **dung chung voi `be`** de khong tai model 519MB hai lan.

Ba duong dan nay van tro vao `be/` vi `be/` con song den pha 05. Khi xoa
`app.py` thi doi thanh `ai/data` va `ai/vectorstore`.

---

## 0e. API TypeScript (pha 04 - dang lam)

Nhom auth da xong va da kiem chung. Bon nhom con lai chua bat dau.

```bash
cd api
npm install
npx prisma migrate deploy
npm run seed:admin            # ADMIN_PASSWORD=... de tu chon mat khau
npm run build && npm start    # cong 4000
./test-auth.sh                # 34 assert
```

Hoac qua Docker: `docker compose up -d --build api`.

### Tien do pha 04

| Nhom | Route | Trang thai |
|---|---|---|
| Auth | 8 | **Xong** - `./test-auth.sh`, 34 assert |
| Hoi thoai + tin nhan | 11 | **Xong** - `./test-chat.sh`, 50 assert |
| Dia diem + anh | ~8 | Chua |
| Analytics + dashboard | ~12 | Chua |
| Quan ly nguoi dung | ~6 | Chua |

Nhom hoi thoai phuc vu CA HAI prefix `/api/chat/*` va `/api/mysql-chat/*` tu
mot controller: ban Flask co hai blueprint rieng (mot tren Mongo, mot tren
MySQL) va frontend goi ca hai. Gio ca hai tro ve cung bang Postgres nen
khong con gi de dong bo - `hybrid_chat_service.py` 497 dong tro thanh vo
nghia.

`GET /api/chat/conversations/:id/summary` la cho duy nhat hien tai chung
minh ca chuoi: API nap tin nhan tu Postgres, goi AI service, AI goi LLM.
AI service khong doc database.

Flask (`be/`, cong 5555) van chay song song. Pha 05 moi cat.

### Hop dong giu y nguyen ban Flask

Day la rang buoc quan trong nhat cua pha 04. Frontend hien tai:

- doc `data.error` khi loi - nen co `HttpErrorFilter` dua moi loi ve
  `{error: "..."}`. Khong co no thi Nest tra `{message: [...]}` va moi loi
  hien thong diep mac dinh thay vi ly do that.
- doc `user._id` (ke thua MongoDB) va tron snake_case voi camelCase
  (`profile_picture` canh `businessInfo`). Xem `src/common/wire.ts`.
- dua vao viec **admin duoc thu truoc user** khi dang nhap.

Doi hop dong nay la viec cua pha 06, luc frontend duoc viet lai.

### Ba thu lam khac ban cu

**Mot kieu hash duy nhat: bcrypt** (12 vong). Ban Python co ba kieu song
song - werkzeug, SHA-256 + salt, bcrypt. `npm run seed:admin` thay
`be/create_admin.py`: bam bcrypt, khong hoi tuong tac (ban cu goi `input()`
nen khong chay duoc trong container), va idempotent.

**Ket noi database luoi.** `PrismaService.$connect()` goi trong
`onModuleInit`, khong phai luc import. `be/MySQL/db/__init__.py:23` tao pool
ngay luc import nen DB chet la process chet. `/health` cua API bao
`database: "down"` chu khong lam sap app.

**Tu choi khoi dong khi thieu JWT_SECRET.** Ban Python am tham dung chuoi
hardcode nam trong repo.

### ValidationPipe whitelist

`whitelist: true` bo moi field khong khai bao trong DTO. Da kiem chung: gui
`{"name":"X","isActive":false,"permissions":{...}}` vao `PUT /profile` thi
`name` duoc cap nhat con `isActive` va `permissions` bi bo - client khong tu
kich hoat lai tai khoan hay tu cap quyen duoc.

---

## 0f. Pha 05 - vi sao chua lam duoc

Pha 05 la cat frontend sang API moi roi xoa Flask. **Chua lam duoc**, va day
la so lieu:

| | Handler |
|---|---|
| Flask dang phuc vu | 86 |
| API TypeScript da co | 31 |

Cat bay gio thi auth va lich su chat chay, con lai 404 het: `/chat`,
`/voice-chat`, `/voice-welcome`, va **toan bo Dashboard** (analytics, anh,
dia diem, quan ly nguoi dung, dong bo du lieu).

Con thieu 3 nhom cua pha 04: dia diem + anh, analytics + dashboard, quan ly
nguoi dung.

### Phan cua pha 05 da lam duoc ngay

Xoa code chet da kiem chung khong ai dung:

- `NULL/` - code nhap, khong file nao import. Cung la cho chua API key Groq
  bi commit. **Key van nam trong git history: phai revoke.**
- `ngrok-v3-stable-windows-amd64/` (25MB) va `run_mongodb_test.bat` - cua
  Windows, khong dung duoc tren Linux.
- 10 dependency trong `fe/package.json` ma 0 file nao dung: ba goi
  `@radix-ui/*`, `tailwindcss`, `tailwind-merge`, `tailwindcss-animate`,
  `framer-motion`, `class-variance-authority`, `clsx`, va `vite` khai trung
  o ca `dependencies` lan `devDependencies`. Da rebuild `fe` va verify van
  phuc vu duoc - chung that su chet.

Chua xoa `be/services/hybrid_chat_service.py`: no khong con y nghia nhung
`be/` van la backend dang phuc vu, xoa bay gio khong duoc gi ma lai dung vao
he dang chay. De den pha 05 that.

### Hai man hinh Dashboard da vo tu truoc

`Dashboard/src` goi `/api/dashboard/documents` va
`/api/dashboard/real-analytics` - ca hai **404 ngay tren Flask hien tai**,
khong phai do viec chuyen doi. Dung port hai endpoint nay o pha 04; can quyet
dinh xoa man hinh do hay viet endpoint moi.

Tuong tu, `fe/` goi `/api/chat/history`, `/api/chat/stats`,
`/api/chat/export` tren prefix Mongo - ba cai nay 404 tren Flask. Ban
TypeScript co `/api/chat/stats` va `/api/chat/export` nen thanh ra **da sua
luon** hai cho vo nay.

---

## 1. Backend

> **Bắt buộc dùng venv.** Ubuntu 24.04 chặn cài package system-wide
> (PEP 668). Gõ `pip install ...` khi chưa `activate` venv sẽ ra lỗi
> `error: externally-managed-environment`. Đừng chữa bằng
> `--break-system-packages`, chỉ cần vào venv.

```bash
cd be
python3 -m venv .venv
source .venv/bin/activate     # <-- bỏ dòng này là gặp PEP 668
```

Dấu hiệu đã vào venv đúng: prompt có tiền tố `(.venv)`, và
`which pip` trả về `.../be/.venv/bin/pip` chứ không phải `/usr/bin/pip`.

Máy này không có GPU NVIDIA nên cài torch bản CPU-only, nhẹ hơn khoảng
2.5 GB vì không kéo theo mớ wheel CUDA không dùng tới:

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.8.0
pip install -r requirements.txt edge-tts langdetect
```

`requirements.txt` **đã được sửa 2 chỗ** (trước đó không cài được):

1. **Xoá `langchain-mongodb==0.2.0`.** Nó đòi `numpy<2.0.0` trong khi file
   lại pin `numpy==2.3.1` → pip báo `ResolutionImpossible` và bỏ dở. Không
   file `.py` nào trong `be/` import `langchain_mongodb`, dependency chết.
2. **Thêm `edge-tts==7.2.8` và `langdetect==1.0.9`.** `be/config/noi.py`
   import cả hai nhưng requirements không có — không cài là crash khi boot.

File gốc còn thiếu newline ở cuối, nên nếu tự `>>` append thì dòng mới sẽ
dính vào `python-Levenshtein==0.25.1`. Đã xử lý.

Cài mà không dùng trực tiếp: `googlemaps`, `fuzzywuzzy`, `Pillow` (không
file nào import). `faiss-cpu` và `sentence-transformers` thì phải giữ —
langchain gọi chúng gián tiếp qua `FAISS` và `HuggingFaceEmbeddings`.

Thêm `.venv/` vào file ignore của `be/` (đang là bản kiểu Node, chưa ignore
venv Python).

## 1b. File .env

Đã tạo sẵn `.env` + `.env.example` cho cả 3 project, và đã test
`load_dotenv()` đọc đúng. Chỉ còn 2 chỗ TODO trong `be/.env`:
`GROQ_API_KEY` và `MONGO_URI`.

Ba chỗ dễ sai nhất:

| Biến | Ở đâu | Bẫy |
|---|---|---|
| `JWT_SECRET` | `be/.env` | Bỏ trống là `services/auth_service.py` và `services/admin_auth_service.py` fallback về chuỗi hardcode `'your-secret-key-change-this'` nằm công khai trong repo — ai cũng forge được token admin. Đã sinh sẵn giá trị random 64 ký tự. |
| `MYSQL_PASSWORD` | `be/.env` | Phải set tường minh, kể cả khi rỗng. Default trong code **không khớp nhau**: `app.py`, `MySQL/db/__init__.py`, `services/simple_image_service.py` dùng `"123456"`; còn `MySQL/setup_mysql.py`, `config/hybrid_config.py`, `services/analytics_service.py`, `services/chatbot_service.py` dùng `""`. Bỏ trống là mỗi module connect bằng một password khác nhau. |
| URL backend | `fe/` vs `Dashboard/` | Hai tên biến khác nhau: `fe/` dùng `VITE_API_BASE_URL=http://localhost:5000`, `Dashboard/` dùng `VITE_API_URL=http://localhost:5000/api` — **có `/api` ở cuối**. Đặt sai tên hoặc quên `/api` là Dashboard 404 hết. |

Mọi biến `VITE_*` bị nhúng thẳng vào bundle frontend, ai xem source cũng
đọc được. Chỉ để client id / public key ở đó, không để secret.

File ignore của `be/` và `fe/` đang ignore cả `.env.example`. Nên bỏ dòng
đó — template vốn để commit cho người khác biết cần biến gì. `Dashboard/`
thì đúng, chỉ ignore `.env`.

`app.py:38` set `app.config['JWT_SECRET']` nhưng không ai đọc, và default ở
đó có lỗi typo dấu cách (`'your-secret-k ey-...'`). Dead code, xoá được.

## 1c. Chạy backend

```bash
cd be && source .venv/bin/activate && python app.py
```

**Phải chạy từ trong `be/`** — `app.py` import theo package tương đối
(`RAG.rag_engine`, `config.noi`) và đọc vectorstore ở đường dẫn tương đối
`vectorstore/index`. Chạy từ chỗ khác là lỗi import ngay.

Kiểm tra:

```bash
curl localhost:5000/health
curl -X POST localhost:5000/chat -H 'Content-Type: application/json' \
  -d '{"message":"Vịnh Hạ Long có gì hay?"}'
```

Vectorstore FAISS đã được build sẵn (`be/vectorstore/index/index.faiss`,
20 documents từ `be/data/*.txt`) nên lần chạy đầu không phải build lại. Nếu
sửa file trong `be/data/` thì gọi `POST /api/dashboard/rebuild-vectorstore`.

## 2. Database

**MySQL là bắt buộc, MongoDB thì không.** Hai cái này không đối xứng nhau,
và khối `try/except` quanh phần init DB trong `app.py` không cứu được MySQL:

- **MySQL — bắt buộc để boot.** `be/MySQL/db/__init__.py:23` tạo
  `MySQLConnectionPool` ngay lúc import module, tức là connect luôn. Chuỗi
  import `app.py:11` → `services/mysql_chat_service` →
  `repositories/mysql_chat_repository` → `MySQL.db` chạy **trước** khối
  `try/except` ở `app.py:40`, nên MySQL chết là process chết với
  `DatabaseError: 2003 Can't connect to MySQL server`. Không phải lỗi config
  của bạn.
- **MongoDB — tuỳ chọn khi boot.** Kết nối được init bên trong `try/except`
  nên Mongo tắt thì chỉ in `Warning: Could not initialize databases: ...` rồi
  chạy tiếp. Nhưng thiếu Mongo là mất users, admins và chat history → không
  đăng nhập Dashboard được.

Dựng cả hai bằng docker, password khớp với `be/.env`:

```bash
docker run -d --name qbot-mysql -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=chatbot -p 3306:3306 --restart unless-stopped mysql:8

docker run -d --name qbot-mongo -p 27017:27017 --restart unless-stopped mongo:7
```

MySQL mất khoảng 6s mới nhận connection, đừng chạy `app.py` ngay. Bảng được
`be/MySQL/setup_mysql.py` tự tạo lúc app khởi động, không cần migrate tay.

Lần sau chỉ cần `docker start qbot-mysql qbot-mongo`.

Tạo tài khoản admin để đăng nhập Dashboard (cần MongoDB chạy trước):

```bash
cd be && source .venv/bin/activate && python create_admin.py
# admin@servicehub.com / Admin123!
```

## 3. Frontend chat (`fe/`, port 3000)

```bash
cd fe
npm install
npm run dev        # http://localhost:3000
```

`fe/.env` (tuỳ chọn — mặc định đã trỏ đúng về `localhost:5000`):

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=      # chỉ cần cho nút đăng nhập Google
VITE_FACEBOOK_APP_ID=
```

## 4. Dashboard (port 5173)

```bash
cd Dashboard
npm install
npm run dev        # http://localhost:5173
```

`Dashboard/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

Đăng nhập tại `/login` bằng tài khoản admin ở mục 2.

---

## Những chỗ dễ mắc

- **Thứ tự chạy**: backend trước, frontend sau. FE gọi thẳng
  `http://localhost:5000`, không qua proxy.
- **CORS** trong `be/app.py` chỉ whitelist `localhost:5173`,
  `127.0.0.1:5173`, `localhost:3000`, `127.0.0.1:3333`. Đổi port của FE hay
  Dashboard thì phải sửa list này, nếu không request bị block.
- `Dashboard/vite.config.js` viết `serve:` thay vì `server:` nên option port
  3333 không có tác dụng — Vite dùng default 5173. Đang để nguyên vì 5173 có
  trong CORS whitelist; muốn về 3333 thì sửa cả 2 chỗ (`server:` và thêm
  `http://localhost:3333` vào CORS).
- Proxy `/api` trong `fe/vite.config.js` cấu hình sai: `rewrite` cắt bỏ tiền
  tố `/api` trong khi route backend lại nằm dưới `/api/...`. Hiện không ảnh
  hưởng gì vì không service nào gọi bằng đường dẫn tương đối — nhưng đừng tin
  cái proxy đó.
- `ngrok-v3-stable-windows-amd64/` và các file `.bat` là của Windows, không
  dùng trên Linux.
- **Có một Groq API key thật bị commit trong `NULL/main/notes.txt`** (bắt đầu
  bằng `gsk_l9qE...`). Key nằm trong history nên xoá file không đủ: vào
  https://console.groq.com/keys revoke key đó, rồi tạo key mới cho `be/.env`.
