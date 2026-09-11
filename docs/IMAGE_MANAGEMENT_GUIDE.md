# Hướng dẫn Quản lý Ảnh Chatbot

## 🖼️ Tính năng mới: Upload và quản lý ảnh cho Chatbot

Admin Dashboard hiện đã được cập nhật với tính năng quản lý ảnh, cho phép admin upload ảnh để chatbot hiển thị khi trả lời các câu hỏi về du lịch Quảng Ninh.

## 🚀 Cách sử dụng

### 1. Truy cập Dashboard
```bash
cd Dashboard
npm run dev
```
Dashboard sẽ chạy tại: http://localhost:5173

### 2. Đăng nhập Admin
- Sử dụng tài khoản admin đã tạo
- Truy cập menu "Quản lý ảnh" trong sidebar

### 3. Upload ảnh mới
- Click nút "Tải ảnh lên"
- Chọn file ảnh (PNG, JPG, JPEG, GIF, WebP - tối đa 5MB)
- Chọn địa điểm từ dropdown
- Chọn loại ảnh:
  - **Gallery**: Ảnh thường trong bộ sưu tập
  - **Main**: Ảnh chính đại diện cho địa điểm
- Thêm mô tả (tùy chọn)
- Click "Tải lên"

### 4. Quản lý ảnh đã upload
- Xem danh sách tất cả ảnh đã upload
- Click biểu tượng mắt để xem chi tiết ảnh
- Click biểu tượng thùng rác để xóa ảnh

## 🔧 API Endpoints mới

### Backend (Flask)

#### Upload ảnh
```http
POST /api/dashboard/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form data:
- image: file
- location_id: string
- image_type: string (gallery|main)
- caption: string (optional)
```

#### Lấy danh sách ảnh
```http
GET /api/dashboard/images
Authorization: Bearer <token>
```

#### Lấy danh sách địa điểm
```http
GET /api/dashboard/locations
Authorization: Bearer <token>
```

#### Xóa ảnh
```http
DELETE /api/dashboard/images/{image_id}
Authorization: Bearer <token>
```

## 📁 Cấu trúc file mới

```
chatbot/
├── backend/
│   ├── static/images/uploads/     # Thư mục chứa ảnh upload
│   └── app.py                     # Đã thêm API endpoints
├── Dashboard/
│   └── src/components/images/
│       ├── ImageManagement.jsx    # Component quản lý ảnh
│       └── ImageUploader.jsx      # Component upload ảnh
└── test_image_upload.py           # Script test API
```

## 🎯 Tính năng

### Frontend (React + Chakra UI)
- ✅ Giao diện upload ảnh với drag & drop
- ✅ Preview ảnh trước khi upload
- ✅ Validation file type và size
- ✅ Grid hiển thị ảnh đã upload
- ✅ Modal xem chi tiết ảnh
- ✅ Xóa ảnh với confirmation dialog
- ✅ Loading states và error handling

### Backend (Flask)
- ✅ Upload file với validation
- ✅ Lưu thông tin ảnh vào MySQL
- ✅ Serve static files
- ✅ CRUD operations cho ảnh
- ✅ Authentication required
- ✅ Error handling

### Chatbot Integration
- ✅ Tự động hiển thị ảnh khi trả lời về địa điểm
- ✅ Hỗ trợ nhiều ảnh cho mỗi địa điểm
- ✅ Ưu tiên ảnh main trước gallery
- ✅ Fallback cho trường hợp không có ảnh

## 🧪 Test

Chạy script test để kiểm tra API:
```bash
cd backend
python test_image_upload.py
```

## 🔒 Bảo mật

- Chỉ admin có quyền upload/xóa ảnh
- Validation file type và size
- Tên file được tạo unique để tránh conflict
- Authentication required cho tất cả API

## 📝 Lưu ý

1. **File size limit**: Tối đa 5MB per file
2. **Supported formats**: PNG, JPG, JPEG, GIF, WebP
3. **Storage**: Files được lưu trong `backend/static/images/uploads/`
4. **Database**: Thông tin ảnh lưu trong bảng `location_images`
5. **URL format**: `http://localhost:5000/static/images/uploads/{filename}`

## 🚀 Cách chạy đầy đủ

1. **Backend**:
```bash
cd backend
python app.py
```

2. **Dashboard**:
```bash
cd Dashboard
npm run dev
```

3. **Frontend Chatbot**:
```bash
cd frontend
npm run dev
```

Giờ đây admin có thể dễ dàng upload và quản lý ảnh cho chatbot thông qua giao diện dashboard thân thiện!