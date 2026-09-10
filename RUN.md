# Cách chạy project (Linux)

Bản này thay cho phần "Cách chạy" trong `README.md` — README cũ đã lạc hậu
(`backend/nhap.py`, `frontend/`, `start_servers.bat` đều không còn tồn tại).

## 3 service, 3 port

| Thư mục     | Là gì                  | Port | Lệnh chạy      |
|-------------|------------------------|------|----------------|
| `be/`       | Flask API (`app.py`)   | 5000 | `python app.py`|
| `fe/`       | Chat UI (React + Vite) | 3000 | `npm run dev`  |
| `Dashboard/`| Admin UI (React + Vite)| 5173 | `npm run dev`  |

`NULL/` là code cũ/nháp — bỏ qua. `backend/` và `frontend/` đã được đổi tên
thành `be/` và `fe/` nhưng **chưa commit** (`git status` đang thấy rename này).

---

## 0. Bootstrap (máy này còn thiếu)

Python 3.12.3 có sẵn nhưng thiếu `pip` và `venv`:

```bash
sudo apt install python3-pip python3.12-venv
```

Node 24 + npm 11 đã có sẵn, không cần làm gì.

MongoDB và MySQL **không được cài trên máy này**. Xem mục 2 để chọn cách xử lý.

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

`requirements.txt` cần sửa 2 chỗ mới cài được:

1. **Xoá dòng `langchain-mongodb==0.2.0`.** Nó đòi `numpy<2.0.0` trong khi
   file lại pin `numpy==2.3.1` → pip báo `ResolutionImpossible`, cài chết
   giữa đường. Không file `.py` nào trong `be/` import `langchain_mongodb`,
   đây là dependency chết, xoá là hết conflict.
2. **Thêm `edge-tts` và `langdetect`.** `be/config/noi.py` import cả hai
   nhưng requirements không có — không cài là crash lúc khởi động.

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

App bắt exception khi init DB nên **vẫn boot được khi chưa có DB nào** — chỉ
mất chat history, còn `/chat` (RAG + Groq) hoạt động bình thường.

- **MongoDB** (users, admins, chat history): dùng MongoDB Atlas free tier rồi
  điền `MONGO_URI`. Không set biến này thì pymongo mặc định về
  `localhost:27017` và sẽ timeout.
- **MySQL** (conversations/messages, legacy): chỉ cần nếu dùng
  `/api/mysql-chat/*`. Cài local hoặc
  `docker run -d -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=1 mysql:8`.
  Bảng được `be/MySQL/setup_mysql.py` tự tạo lúc app khởi động.

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
