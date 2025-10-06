# Chatbot Application - Du lịch Quảng Ninh

Ứng dụng chatbot hỗ trợ tư vấn du lịch tỉnh Quảng Ninh sử dụng React frontend và Flask backend với Groq API.

## 🚀 Cách chạy ứng dụng

### Phương pháp 1: Sử dụng script tự động (Windows)
```bash
# Chạy file batch để khởi động cả backend và frontend
start_servers.bat
```

### Phương pháp 2: Chạy thủ công

#### 1. Khởi động Backend
```bash
cd backend
python nhap.py
```
Backend sẽ chạy tại: http://localhost:5000

#### 2. Khởi động Frontend
```bash
cd frontend
npm install  # Chỉ cần chạy lần đầu
npm run dev
```
Frontend sẽ chạy tại: http://localhost:5173 (hoặc port khác được hiển thị trong terminal)

## 🧪 Test API

Để test API backend:
```bash
python test_api.py
```

Để test MongoDB sync:
```bash
python test_mongodb_sync.py
```

## 📁 Cấu trúc dự án

```
chatbot/
├── backend/
│   ├── nhap.py          # Flask API server
│   ├── .env             # Environment variables (GROQ_API_KEY)
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component
│   │   ├── services/
│   │   │   └── api.js   # API service layer
│   │   └── components/  # React components
│   ├── .env             # Frontend environment (API URL)
│   └── package.json     # Node.js dependencies
└── README.md
```

## 🔧 Cấu hình

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=chatbot
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000
```

## 📝 API Endpoints

### POST /chat
Gửi tin nhắn đến chatbot
```json
{
  "message": "Xin chào! Bạn có thể giới thiệu về du lịch Quảng Ninh không?"
}
```

Response:
```json
{
  "status": "success",
  "response": "Xin chào! Tôi là trợ lý du lịch Quảng Ninh..."
}
```

### GET /health
Kiểm tra trạng thái server
```json
{
  "status": "healthy",
  "message": "Server is running"
}
```

### MongoDB Data Management
- `GET /api/dashboard/mongodb/sync-status` - Lấy trạng thái đồng bộ
- `POST /api/dashboard/mongodb/sync-all` - Đồng bộ tất cả file
- `POST /api/dashboard/mongodb/force-resync` - Đồng bộ lại từ đầu
- `POST /api/dashboard/mongodb/sync-file/<filename>` - Đồng bộ file cụ thể
- `GET /api/dashboard/mongodb/file/<filename>` - Lấy nội dung file từ MongoDB

## 🎯 Tính năng

- ✅ Chat interface với React + Chakra UI
- ✅ Flask backend với Groq API integration
- ✅ CORS support cho cross-origin requests
- ✅ Error handling và loading states
- ✅ Responsive design
- ✅ Multi-language support (Vietnamese/English)
- ✅ Message history
- ✅ Copy message functionality
- ✅ Dashboard quản lý dữ liệu
- ✅ MongoDB integration cho data storage
- ✅ MySQL integration cho conversations và messages
- ✅ File upload và sync với MongoDB

## 🤖 Chatbot Capabilities

Chatbot được cấu hình để:
- Trả lời các câu hỏi về du lịch tỉnh Quảng Ninh
- Hỗ trợ cả tiếng Việt và tiếng Anh
- Từ chối trả lời các câu hỏi ngoài phạm vi du lịch Quảng Ninh
- Cung cấp thông tin chính xác và hữu ích

## 🔍 Troubleshooting

### Backend không khởi động được
- Kiểm tra Python đã được cài đặt
- Kiểm tra GROQ_API_KEY trong file .env
- Cài đặt dependencies: `pip install -r requirements.txt`

### Frontend không kết nối được backend
- Kiểm tra backend đang chạy tại http://localhost:5000
- Kiểm tra VITE_API_BASE_URL trong frontend/.env
- Kiểm tra CORS settings trong backend

### API trả về lỗi
- Kiểm tra GROQ_API_KEY có hợp lệ không
- Kiểm tra kết nối internet
- Xem logs trong terminal backend để debug

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Cả backend và frontend đều đang chạy
2. Environment variables được cấu hình đúng
3. Dependencies đã được cài đặt đầy đủ
4. Ports 5000 và 5173 không bị conflict