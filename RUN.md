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

Python 3.12.3 có sẵn nhưng **không có `pip` và không có `venv`**:

```bash
sudo apt install python3.12-venv
```

Node 24 + npm 11 đã có sẵn, không cần làm gì.

MongoDB và MySQL **không được cài trên máy này**. Xem mục 2 để chọn cách xử lý.

---

## 1. Backend

```bash
cd be
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install edge-tts langdetect     # thiếu trong requirements.txt, code có import
```

Cài mất khá lâu và tốn ~2–3 GB: `torch` + `sentence-transformers` +
`transformers` đều nằm trong requirements (dùng cho embedding của RAG).

Tạo `be/.env`:

```env
# Bắt buộc
GROQ_API_KEY=gsk_...

# Chat history (MongoDB là store chính)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# Tuỳ chọn — thiếu thì app vẫn chạy, chỉ in warning
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=chatbot
MYSQL_PORT=3306

JWT_SECRET=doi-cai-nay-di
GOOGLE_CLIENT_ID=          # chỉ cần nếu dùng đăng nhập Google
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

Chạy:

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
