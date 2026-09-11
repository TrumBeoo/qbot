# Dashboard Integration với Chatbot Du lịch Quảng Ninh

## Tổng quan
Dashboard đã được tích hợp hoàn toàn với backend chatbot, cho phép doanh nghiệp quản lý và theo dõi hiệu suất chatbot du lịch Quảng Ninh.

## Tính năng đã tích hợp

### 1. Dashboard Chính
- **Thống kê tổng quan**: Hiển thị số liệu về cuộc trò chuyện, tin nhắn, người dùng
- **Thống kê chatbot**: Tích hợp trực tiếp thống kê từ hệ thống RAG
- **Widget chatbot**: Chatbot floating có thể test trực tiếp

### 2. Quản lý Chatbot (/chatbot)
- **Quản lý dữ liệu**: Thêm, sửa, xóa tài liệu dữ liệu
- **Test chatbot**: Test trực tiếp với giao diện chat
- **Cài đặt hệ thống**: Rebuild vector store

### 3. Báo cáo & Phân tích (/analytics)
- **Tổng quan**: Metrics chính về hoạt động chatbot
- **Hoạt động hàng ngày**: Thống kê 7 ngày qua
- **Phân tích ngôn ngữ**: Phân bố sử dụng tiếng Việt/English
- **Hiệu suất hệ thống**: Thông tin về RAG system

## API Endpoints mới

### Chatbot Management
```
GET    /api/dashboard/chatbot-stats     - Lấy thống kê chatbot
GET    /api/dashboard/data-sources      - Lấy danh sách tài liệu
POST   /api/dashboard/data-sources      - Thêm tài liệu mới
GET    /api/dashboard/data-sources/:id  - Lấy nội dung tài liệu
PUT    /api/dashboard/data-sources/:id  - Cập nhật tài liệu
DELETE /api/dashboard/data-sources/:id  - Xóa tài liệu
POST   /api/dashboard/chatbot-test      - Test chatbot
POST   /api/dashboard/rebuild-vectorstore - Rebuild vector store
```

## Cấu trúc file mới

### Backend
```
backend/
├── services/
│   └── chatbot_service.py          # Service quản lý chatbot
└── app.py                          # API endpoints mới
```

### Frontend
```
Dashboard/src/
├── components/
│   └── ChatbotWidget.jsx           # Widget chatbot
├── pages/
│   ├── ChatbotManagement.jsx       # Trang quản lý chatbot
│   ├── Dashboard.jsx               # Dashboard với thống kê
│   └── Analytics.jsx               # Trang phân tích
└── services/
    └── api.js                      # API calls mới
```

## Cách sử dụng

### 1. Khởi động hệ thống
```bash
# Backend
cd backend
python app.py

# Frontend
cd Dashboard
npm run dev
```

### 2. Truy cập Dashboard
- URL: http://localhost:5174
- Đăng ký/Đăng nhập tài khoản doanh nghiệp
- Truy cập các tính năng:
  - Dashboard: Xem thống kê tổng quan
  - Chatbot: Quản lý dữ liệu và test
  - Báo cáo: Phân tích chi tiết

### 3. Quản lý dữ liệu chatbot
1. Vào trang **Chatbot** → tab **Quản lý dữ liệu**
2. Thêm tài liệu mới bằng nút "Thêm tài liệu"
3. Chỉnh sửa/xóa tài liệu hiện có
4. Rebuild vector store sau khi thay đổi dữ liệu

### 4. Test chatbot
1. Vào trang **Chatbot** → tab **Test Chatbot**
2. Chọn ngôn ngữ (Tiếng Việt/English)
3. Nhập câu hỏi và xem kết quả
4. Hoặc sử dụng widget chatbot floating ở góc phải

### 5. Xem báo cáo
1. Vào trang **Báo cáo**
2. Xem các tab:
   - Tổng quan: Metrics chính
   - Hoạt động hàng ngày: Xu hướng sử dụng
   - Phân tích ngôn ngữ: Phân bố ngôn ngữ
   - Hiệu suất hệ thống: Thông tin kỹ thuật

## Tính năng nổi bật

### 1. Real-time Statistics
- Thống kê được cập nhật real-time từ database
- Hiển thị số liệu chính xác về hoạt động chatbot

### 2. Data Management
- Giao diện thân thiện để quản lý tài liệu
- Hỗ trợ thêm/sửa/xóa tài liệu trực tiếp
- Tự động rebuild vector store

### 3. Interactive Testing
- Test chatbot trực tiếp trong dashboard
- Hỗ trợ cả tiếng Việt và English
- Hiển thị nguồn tham khảo (sources)

### 4. Comprehensive Analytics
- Phân tích chi tiết hoạt động chatbot
- Biểu đồ và thống kê trực quan
- Theo dõi xu hướng sử dụng

## Bảo mật
- Tất cả API endpoints yêu cầu authentication
- Token-based authentication với JWT
- Phân quyền theo vai trò người dùng

## Lưu ý kỹ thuật
- Backend chạy trên port 5000
- Frontend chạy trên port 5174
- Database MongoDB cần được cấu hình trong .env
- GROQ_API_KEY cần được thiết lập cho LLM

## Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend có chạy trên port 5000
- Kiểm tra CORS settings
- Xác nhận token authentication

### Lỗi chatbot không hoạt động
- Kiểm tra GROQ_API_KEY trong .env
- Xác nhận vector store đã được tạo
- Kiểm tra dữ liệu trong thư mục data/

### Lỗi thống kê không hiển thị
- Kiểm tra kết nối MongoDB
- Xác nhận có dữ liệu chat history
- Kiểm tra API endpoints trong browser console