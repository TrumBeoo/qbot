# MongoDB Sync Setup Guide

## Vấn đề đã được sửa

✅ **CORS Error**: Đã cấu hình CORS đúng cách trong backend
✅ **URL Duplicate**: Đã sửa URL từ `/api/api/dashboard/...` thành `/dashboard/...`
✅ **Authentication**: Đã sử dụng admin có sẵn từ `create_admin.py`
✅ **JSON Serialization**: Đã sửa lỗi ObjectId và datetime serialization

## Cách sử dụng MongoDB Sync

### 1. Khởi động Backend
```bash
cd backend
python app.py
```

### 2. Khởi động Dashboard
```bash
cd Dashboard
npm run dev
```

### 3. Đăng nhập Dashboard

**Cách 1: Sử dụng form login**
- Truy cập: http://localhost:5173/login
- Email: `admin@servicehub.com`
- Password: `Admin123!`

**Cách 2: Sử dụng test page (nhanh hơn)**
- Mở file: `test_dashboard_login.html` trong browser
- Token sẽ được tự động lưu vào localStorage
- Sau đó truy cập: http://localhost:5173

### 4. Truy cập MongoDB Sync

1. Vào Dashboard → **Quản lý dữ liệu**
2. Click nút **MongoDB Sync**
3. Sử dụng các chức năng:
   - **Làm mới**: Cập nhật trạng thái đồng bộ
   - **Đồng bộ tất cả**: Sync tất cả file từ thư mục `data/` lên MongoDB
   - **Đồng bộ lại**: Xóa tất cả và sync lại từ đầu
   - **Đồng bộ lại** (từng file): Sync lại file cụ thể

## API Endpoints

### MongoDB Sync Endpoints
- `GET /api/dashboard/mongodb/sync-status` - Lấy trạng thái đồng bộ
- `POST /api/dashboard/mongodb/sync-all` - Đồng bộ tất cả file
- `POST /api/dashboard/mongodb/force-resync` - Đồng bộ lại từ đầu
- `POST /api/dashboard/mongodb/sync-file/<filename>` - Đồng bộ file cụ thể
- `GET /api/dashboard/mongodb/file/<filename>` - Lấy nội dung file từ MongoDB

### Authentication
- `POST /api/auth/login` - Đăng nhập (hỗ trợ cả user và admin)
- `POST /api/auth/verify-token` - Xác thực token

## Test Scripts

### Test MongoDB Endpoints
```bash
cd backend
python test_simple_admin.py
```

### Test MongoDB Sync Functions
```bash
cd backend
python simple_mongodb_test.py
```

## Cấu trúc dữ liệu MongoDB

### Collection: `data`
```json
{
  "_id": "ObjectId",
  "filename": "data.txt",
  "content": "File content...",
  "file_hash": "md5_hash",
  "file_size": 1024,
  "status": "active|inactive|deleted",
  "created_at": "2024-01-01T00:00:00Z",
  "sync_timestamp": "2024-01-01T00:00:00Z",
  "metadata": {
    "line_count": 100,
    "word_count": 500,
    "last_modified": 1704067200
  }
}
```

## Troubleshooting

### 1. CORS Error
- Đảm bảo backend đang chạy trên port 5000
- Kiểm tra CORS config trong `app.py`

### 2. Authentication Error
- Đảm bảo đã login với admin credentials đúng
- Kiểm tra token trong localStorage

### 3. MongoDB Connection Error
- Kiểm tra MONGO_URI trong `.env`
- Test connection: `python simple_mongodb_test.py`

### 4. File Not Found Error
- Đảm bảo có file .txt trong thư mục `backend/data/`
- Kiểm tra quyền đọc file

## Admin Credentials

- **Email**: admin@servicehub.com
- **Password**: Admin123!
- **Collection**: admins
- **Role**: admin

## Tính năng MongoDB Sync

✅ **Sync Status**: Hiển thị trạng thái file (active/inactive/deleted)
✅ **File Metadata**: Theo dõi kích thước, số dòng, số từ
✅ **Change Detection**: Phát hiện thay đổi nội dung bằng hash
✅ **Batch Sync**: Đồng bộ nhiều file cùng lúc
✅ **Error Handling**: Xử lý lỗi và hiển thị thông báo
✅ **Real-time UI**: Cập nhật giao diện theo thời gian thực