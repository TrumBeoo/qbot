# Chạy QBot

Chatbot du lịch Quảng Ninh. Cập nhật 10/09/2026.

## Cấu trúc

```
be/         Backend TypeScript (NestJS + Prisma)   — pnpm dev
fe/         Chat UI (React + Vite)                 — pnpm dev
Dashboard/  Admin UI (React + Vite)                — pnpm dev
ai/         Python: RAG, TTS, nhận diện ngôn ngữ   — chạy trong Docker
legacy/     Flask cũ — còn phục vụ CRUD/auth, xoá ở pha 05
docs/       Tài liệu theo chủ đề
```

`ai/` giữ luôn `data/` (tài liệu nguồn) và `vectorstore/` (FAISS index).

## Chạy

Hai lệnh: hạ tầng bằng Docker, ba app TypeScript chạy trực tiếp để có hot
reload.

```bash
pnpm setup      # lần đầu: cài dependency cho be/, fe/, Dashboard/
pnpm infra      # Docker: postgres, mysql, mongo, ai, legacy
pnpm dev        # Host: be (4000), fe (3000), Dashboard (5173)
```

Mở `http://localhost:3000` (chat) và `http://localhost:5173` (dashboard).

**Chỉ cần một thứ trước khi chạy:** `GROQ_API_KEY` trong `.env` ở thư mục gốc
(lấy ở https://console.groq.com/keys). Mọi cái khác đã cấu hình sẵn.

| Lệnh | Làm gì |
|---|---|
| `pnpm dev` | 3 app TypeScript trên host, hot reload |
| `pnpm dev:be` / `dev:fe` / `dev:dash` | Chạy riêng một app |
| `pnpm infra` | Docker: database + `ai` + `legacy` |
| `pnpm db` | Chỉ database |
| `pnpm ai` | Chỉ service Python |
| `pnpm infra:stop` | Dừng phần Docker |
| `pnpm test` | 84 assert + kiểm schema |
| `pnpm typecheck` | 3 project, phải ra 0 lỗi |
| `pnpm seed` | Tạo lại admin |

Đăng nhập dashboard: `admin@servicehub.com` / `Admin123!`

### Chạy tất cả trong Docker

Muốn không cài gì trên máy:

```bash
pnpm docker        # cả 8 service, log ở terminal
pnpm docker:bg     # chạy nền
pnpm logs
pnpm stop          # dừng, giữ dữ liệu
pnpm reset         # dừng và XOÁ hết dữ liệu
```

Cách này phục vụ bản `fe`/`Dashboard` đã build nên **không có hot reload** —
sửa code phải rebuild. Dùng `pnpm dev` khi đang code.

Hai cách xung đột port: `pnpm dev` cần 4000/3000/5173, mà `pnpm docker` cũng
publish đúng ba port đó. Chạy `pnpm infra` thay vì `pnpm docker` khi dùng
`pnpm dev`.

---

## Cổng

| | Port | |
|---|---|---|
| `fe` | 3000 | |
| `Dashboard` | 5173 | |
| `legacy` (Flask) | 5555 | **Frontend hiện gọi cái này** |
| `be` (TypeScript) | 4000 | Chạy song song, chưa ai gọi |
| `ai` | — | Nội bộ, không publish |
| `postgres` | 5432 | Store đích |
| `mysql` | 3306 | Legacy |
| `mongo` | 27017 | Legacy |

Luồng đích sau pha 05: `fe`/`Dashboard` → `be` → `ai` · `postgres`.
Trình duyệt chỉ nói chuyện với `be`; `ai` không mở ra internet và **không đọc
database** — mọi thứ nó cần đều nằm trong request.

## Trạng thái lộ trình

| Pha | Việc | |
|---|---|---|
| 01 | Docker hoá | Xong |
| 02 | Gộp MySQL + MongoDB về PostgreSQL | Xong |
| 03 | Tách AI service | Xong |
| 04 | Port CRUD sang `be` (TypeScript) | **2/5 nhóm** (auth, hội thoại) |
| 05 | Cắt frontend sang `be`, xoá `legacy/` | **Một phần** |
| 06 | JSX sang TSX | Xong, typecheck 0 lỗi |

`legacy/` còn phục vụ `/chat`, `/voice-chat`, và toàn bộ Dashboard
(analytics, ảnh, địa điểm, quản lý người dùng). Còn 3 nhóm của pha 04 phải
port trước khi xoá được nó.

Nhưng phần dọn được của pha 05 đã làm:

- **Xoá tính năng memory** (1.402 dòng, 3 service, 8 endpoint). Không file
  nào trong `fe/src` hay `Dashboard/src` gọi `/chat-with-memory` hoặc
  `/api/memory/*` — tính năng không có client.
- **`legacy/` không còn mang bản copy code AI.** `RAG/rag_engine.py`,
  `RAG/loader.py` và `config/noi.py` (854 dòng trùng với `ai/`) được thay
  bằng shim HTTP 200 dòng gọi sang `ai`. Giữ nguyên tên và chữ ký nên 29 chỗ
  gọi trong `app.py` không phải sửa.
- **Bỏ 10 dependency nặng** khỏi `legacy/requirements.txt`: torch,
  transformers, sentence-transformers, faiss-cpu, huggingface-hub, edge-tts,
  langdetect và ba gói langchain. Ảnh Docker **2.43 GB → 383 MB**.

`legacy/` giờ là 6.448 dòng Python thuần CRUD + auth, không còn phụ thuộc
AI nào.

---

## Biến môi trường

**Một file `.env` duy nhất ở thư mục gốc** cho cả stack. Compose truyền nó cho
`legacy`, `be`, `ai`; chạy trên host thì cả Flask và Node đều tự đọc nó.

Ngoại lệ duy nhất: `be/.env` chỉ có `DATABASE_URL`, đọc **sau** root `.env` để
ghi đè về `localhost` cho lần chạy trên host. Trong container compose ghi đè
thành `@postgres:5432`.

Bốn biến dễ đặt sai:

| Biến | Bẫy |
|---|---|
| `GROQ_API_KEY` | Thiếu thì `/chat` vẫn trả **HTTP 200** nhưng nội dung là câu xin lỗi "đang gặp vấn đề kỹ thuật". Chỉ log server nói thật. |
| `GROQ_MAX_TOKENS` | Trên 1000 là mọi request RAG trả **HTTP 429** — free tier Groq cho 1000 output token/phút. |
| `MYSQL_PASSWORD` | Phải set tường minh, kể cả rỗng. Default trong `legacy/` **không khớp nhau** giữa 7 module (`"123456"` ở 3 chỗ, `""` ở 4 chỗ). |
| `JWT_SECRET` | `be` **từ chối khởi động** nếu thiếu. `legacy` thì âm thầm dùng chuỗi hardcode nằm công khai trong repo. |

Frontend dùng **hai tên biến khác nhau** cho cùng một backend: `fe/` đọc
`VITE_API_BASE_URL`, `Dashboard/` đọc `VITE_API_URL` và giá trị **phải có
`/api` ở cuối**. Cả hai bị nhúng vào bundle lúc **build**, nên đổi giá trị thì
phải build lại chứ không phải restart.

**Sửa `.env` là phải restart service.** `load_dotenv()` và `--env-file` chỉ
đọc lúc khởi động.

---

## Kiểm tra

```bash
pnpm test         # cần postgres đang chạy và be đang lên
pnpm typecheck
```

`pnpm test` tự seed admin rồi chạy ba thứ trong `be/`:

| | Kiểm gì |
|---|---|
| `test-auth.sh` | 34 assert — hợp đồng 8 route auth |
| `test-chat.sh` | 50 assert — hợp đồng hội thoại + cách ly người dùng |
| `prisma/smoke.mjs` | Schema Postgres: uuid, FK, cascade, enum, timestamptz |

Hai bộ `test-*.sh` không đo coverage mà **khoá hợp đồng API**: pha 05 phải cắt
được bằng một dòng đổi biến môi trường, nên lệch hợp đồng là vỡ frontend.

AI service có self-check riêng:
`docker compose exec -T ai python summarize.py`.

---

## Chạy Python trên host (không Docker)

Chỉ cần khi sửa code RAG. Bình thường `pnpm ai` là đủ.

```bash
sudo apt install python3-pip python3.12-venv
cd ai
python3 -m venv .venv && source .venv/bin/activate
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.8.0
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Ubuntu 24.04 chặn cài package system-wide (PEP 668). Gõ `pip install` khi chưa
`activate` sẽ ra `error: externally-managed-environment`; đừng chữa bằng
`--break-system-packages`. torch bản CPU-only vì máy không có GPU NVIDIA —
nhẹ hơn ~2.5 GB.

`legacy/` (Flask) cũng tương tự nhưng phải chạy từ trong `legacy/` vì nó
import theo package tương đối.

---

## Bẫy đã biết

- **`tsx` không chạy được `be`.** esbuild (nền của tsx và bun) không hỗ trợ
  `emitDecoratorMetadata`, mà NestJS cần metadata đó để inject constructor.
  Không có nó thì mọi service inject vào đều `undefined` và lỗi hiện ra rất
  khó đoán: `Cannot read properties of undefined (reading 'register')`. Đã
  thử thật. `pnpm dev` dùng `node --watch -r ts-node/register`. Chi tiết ở
  `be/DEV_RUNNER.md`.
- **Sửa code trong `legacy/` phải rebuild image, không phải restart.**
  `legacy/Dockerfile` dùng `COPY . .` nên code nằm trong ảnh.
  `docker compose up -d --build legacy`.
- **Xoá `node_modules` thì phải `pnpm exec prisma generate` lại.**
  `pnpm install` không tự sinh Prisma Client; thiếu nó thì typecheck ra 37 lỗi
  ở mọi file dùng Prisma.
- **Đừng để IDE tự sửa import khi di chuyển thư mục Python.** Kéo thư mục một
  lần đã làm VS Code viết lại 4 import trong `ai/` thành `from be.server.ai...`
  và container chết với `ModuleNotFoundError`. Sau khi di chuyển, kiểm
  `grep -rn "^from be\.\|^import be\." ai/`.
- **VS Code có thể báo `moduleResolution` và `baseUrl` deprecated** trong
  `be/tsconfig.json` — đó là do editor dùng TypeScript mới hơn project.
  `.vscode/settings.json` đã trỏ `typescript.tsdk` vào bản của project.
  `moduleResolution` phải giữ `node`: đổi sang `node16` là TS resolve rxjs vào
  file `.ts` nguồn và sinh 20 lỗi trong `node_modules`.
- **Uid container phải khớp uid host.** `ai/vectorstore/` và
  `legacy/static/images/` là bind mount. Máy khác uid 1000 thì đặt
  `DOCKER_UID` trong `.env` (`id -u`). Volume `qbot_hfcache` giữ ownership từ
  lần tạo đầu; chữa mà không phải tải lại model 519 MB:
  `docker run --rm -v qbot_hfcache:/c alpine:3 chown -R 1000:1000 /c`.
- **MySQL là bắt buộc để `legacy` boot**, MongoDB thì không.
  `legacy/MySQL/db/__init__.py:23` tạo connection pool ngay lúc import, và
  chuỗi import từ `app.py:11` chạy **trước** khối `try/except` ở `app.py:40`.
- **Hai màn hình Dashboard đã vỡ từ trước**: gọi `/api/dashboard/documents` và
  `/api/dashboard/real-analytics`, cả hai **404 ngay trên Flask hiện tại**.
  Đừng port hai endpoint này; cần quyết định xoá màn hình hay viết mới.
- **Groq đã ngừng model `llama-3.3-70b-versatile`** (HTTP 404). Giờ đọc từ
  `GROQ_MODEL`, mặc định `qwen/qwen3.8-27b`.
- **Có một Groq API key thật đã bị commit** trong `NULL/main/notes.txt` (bắt
  đầu `gsk_l9qE...`). File đã xoá nhưng **key vẫn trong git history** —
  revoke ở https://console.groq.com/keys.
- **`be` là ảnh Docker một stage** (1.1 GB), khác `fe`/`Dashboard` hai stage.
  pnpm đặt `node_modules` dạng symlink nên Prisma Client sinh ra nằm trong
  `.pnpm/@prisma+client@<phiên-bản>_<hash>/` — tên có hash nên copy giữa các
  stage vỡ. Đổi lấy ~90 MB.
- **`Dashboard/vite.config.js` viết `serve:` thay vì `server:`** nên port 3333
  vô hiệu, Vite dùng 5173. Để nguyên vì 5173 nằm trong `CORS_ORIGINS`.
- **Proxy `/api` trong `fe/vite.config.js` sai** — `rewrite` cắt bỏ `/api`
  trong khi route backend nằm dưới `/api/...`. Không ai dùng đường dẫn tương
  đối nên vô hại, nhưng đừng tin nó.
- **Dashboard trộn hai UI library**: MUI 33 file, Chakra 7 file.
- **MUI v7 bỏ prop `item`/`xs`/`lg` của `Grid`** nhưng code viết theo API
  v5/v6 ở 72 chỗ → layout xếp full-width. Đã đổi sang `GridLegacy as Grid`;
  còn `TODO` migrate sang `<Grid size={{ xs: 12, lg: 6 }}>`.
- **`strictNullChecks` đang tắt** ở `fe`/`Dashboard`. Bật lên là +67 lỗi (đã
  đo). Hai chỗ đã ghi chú cách nâng cấp trong code.
- **Kiểu API viết tay ở ba chỗ**: `be/src/common/wire.ts` là nguồn sự thật,
  `fe/src/types/api.ts` và `Dashboard/src/types/api.ts` copy theo.

## Quyết định còn treo

**Có gộp bảng `admins` vào `users` với cột `role` không?** Hiện là hai bảng
nên `login()` phải query hai bảng và `resolveSubject()` phải rẽ nhánh. Gộp thì
pha 04 viết một auth service thay vì hai — càng port nhiều nhóm thì càng đắt
để đổi sau.
