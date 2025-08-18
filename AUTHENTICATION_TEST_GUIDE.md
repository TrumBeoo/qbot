# 🔐 Authentication System Test Guide

Hướng dẫn kiểm tra toàn diện hệ thống đăng ký đăng nhập của ứng dụng Chatbot Du lịch Quảng Ninh.

## 📋 Tổng quan

Hệ thống authentication bao gồm:
- **Backend**: Flask API với JWT authentication
- **Frontend**: React components với Chakra UI
- **Database**: MongoDB với user collections
- **Social Login**: Google và Facebook OAuth

## 🧪 Cách chạy tests

### 1. Backend Authentication Tests

```bash
# Đảm bảo backend đang chạy
cd backend
python app.py

# Chạy test trong terminal mới
cd ..
python test_authentication.py
```

### 2. Frontend Authentication Tests

```bash
# Mở browser console và chạy:
frontendAuthTests.runAllTests()

# Hoặc include script trong HTML:
<script src="test_frontend_auth.js"></script>
```

### 3. Manual Testing

#### Đăng ký tài khoản mới:
1. Mở ứng dụng tại http://localhost:5173
2. Click nút đăng nhập/đăng ký
3. Chuyển sang tab "Create Account"
4. Nhập thông tin:
   - Tên: Test User
   - Email: test@example.com
   - Mật khẩu: testpassword123
5. Click "Create Account"

#### Đăng nhập:
1. Sử dụng email và mật khẩu đã đăng ký
2. Click "Sign In"
3. Kiểm tra token được lưu trong localStorage

## 📊 Test Coverage

### Backend Tests ✅

| Test Case | Mô tả | Status |
|-----------|-------|--------|
| Health Check | Kiểm tra server hoạt động | ✅ |
| User Registration | Đăng ký tài khoản mới | ✅ |
| Duplicate Registration | Từ chối email trùng lặp | ✅ |
| User Login | Đăng nhập thành công | ✅ |
| Invalid Login | Từ chối thông tin sai | ✅ |
| Token Verification | Xác thực JWT token | ✅ |
| Protected Routes | Truy cập route cần auth | ✅ |
| Unauthorized Access | Từ chối truy cập không auth | ✅ |
| Profile Update | Cập nhật thông tin user | ✅ |
| Input Validation | Kiểm tra dữ liệu đầu vào | ✅ |
| Authenticated Chat | Chat với authentication | ✅ |

### Frontend Tests ✅

| Component | Test Cases | Status |
|-----------|------------|--------|
| AuthService | API calls, token management | ✅ |
| AuthContext | State management | ✅ |
| AuthModal | Form validation, UI | ✅ |
| Form Validation | Email, password validation | ✅ |
| Local Storage | Token storage/retrieval | ✅ |
| Error Handling | Error messages display | ✅ |
| Social Login | Google/Facebook config | ⚠️ |

## 🔍 Các vấn đề đã phát hiện

### 🔴 High Priority Issues

1. **Log Injection (CWE-117)** - `services/chat_service.py:83`
   - User input được log trực tiếp
   - **Fix**: Sanitize input trước khi log

2. **NoSQL Injection (CWE-943)** - `repositories/chat_repository.py:122`
   - Query parameter không được validate
   - **Fix**: Validate và sanitize query input

3. **Path Traversal (CWE-22)** - `rag_engine.py:59`
   - File path construction không an toàn
   - **Fix**: Sử dụng safe_join() hoặc validate path

### 🟡 Medium Priority Issues

4. **Resource Leak** - `db/__init__.py:11`
   - MongoDB client không được đóng
   - **Fix**: Implement proper connection management

5. **Performance Issues** - Multiple files
   - Inefficient database queries
   - **Fix**: Implement pagination, optimize queries

6. **Error Handling** - Multiple files
   - Thiếu error handling cho database operations
   - **Fix**: Add try-catch blocks

### 🟢 Low Priority Issues

7. **Logging Issues** - Multiple files
   - Sử dụng print() thay vì logging framework
   - **Fix**: Replace với proper logging

## 🛠️ Khắc phục các vấn đề

### 1. Fix Log Injection

```python
# services/chat_service.py
import re

def sanitize_log_input(text):
    # Remove newlines and control characters
    return re.sub(r'[\r\n\t]', ' ', str(text))

# Thay thế:
print(f"Search error: {str(e)}")
# Bằng:
logger.error(f"Search error: {sanitize_log_input(str(e))}")
```

### 2. Fix NoSQL Injection

```python
# repositories/chat_repository.py
def search_conversations(user_id, query, limit=10):
    # Validate and sanitize query
    if not isinstance(query, str):
        raise ValueError("Query must be a string")
    
    # Escape special regex characters
    escaped_query = re.escape(query.strip())
    
    # Use escaped query in MongoDB operation
    search_filter = {
        "user_id": ObjectId(user_id),
        "$or": [
            {"title": {"$regex": escaped_query, "$options": "i"}},
            {"messages.text": {"$regex": escaped_query, "$options": "i"}}
        ]
    }
```

### 3. Fix Resource Leak

```python
# db/__init__.py
import atexit
from pymongo import MongoClient

client = MongoClient(MONGO_URI)

# Register cleanup function
def cleanup_db():
    if client:
        client.close()

atexit.register(cleanup_db)
```

## 🔧 Environment Setup

### Backend Environment Variables

```env
# .env file
JWT_SECRET=your-strong-jwt-secret-key
MONGO_URI=mongodb://localhost:27017/chatbot_AI
GROQ_API_KEY=your-groq-api-key

# Social Login (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### Frontend Environment Variables

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

## 📈 Performance Recommendations

### Database Optimization

1. **Indexes**: Đã tạo indexes cho users và chat collections
2. **Pagination**: Implement pagination cho large datasets
3. **Connection Pooling**: Sử dụng connection pooling

### Frontend Optimization

1. **Token Refresh**: Implement automatic token refresh
2. **Error Boundaries**: Add React error boundaries
3. **Loading States**: Improve loading state management

## 🔒 Security Best Practices

### Implemented ✅

- JWT token authentication
- Password hashing với Werkzeug
- CORS configuration
- Input validation
- Protected routes

### Recommended Improvements 🔄

- Rate limiting cho login attempts
- Password strength requirements
- Account lockout mechanism
- Email verification
- Two-factor authentication (2FA)

## 📝 Test Results Example

```
🚀 Starting Authentication System Tests
Time: 2024-01-15 10:30:00
Target: http://localhost:5000

============================================================
🧪 Health Check
============================================================
✅ PASS: Server is running

============================================================
🧪 User Registration
============================================================
✅ PASS: User registration successful
✅ PASS: Token received: eyJhbGciOiJIUzI1NiIsInR5...

============================================================
🏁 TEST RESULTS SUMMARY
============================================================
✅ Passed: 11
❌ Failed: 0
📊 Success Rate: 100.0%
🎉 All tests passed! Authentication system is working correctly.
```

## 🆘 Troubleshooting

### Common Issues

1. **Server không khởi động**
   - Kiểm tra MongoDB connection
   - Kiểm tra environment variables
   - Kiểm tra port conflicts

2. **Token verification fails**
   - Kiểm tra JWT_SECRET consistency
   - Kiểm tra token expiration
   - Kiểm tra Authorization header format

3. **Database connection errors**
   - Kiểm tra MongoDB service
   - Kiểm tra MONGO_URI format
   - Kiểm tra network connectivity

### Debug Commands

```bash
# Check MongoDB connection
python -c "from db import mongo_db; print(mongo_db.client.server_info())"

# Test API endpoints
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Check JWT token
python -c "import jwt; print(jwt.decode('YOUR_TOKEN', 'YOUR_SECRET', algorithms=['HS256']))"
```

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra logs trong terminal backend
2. Kiểm tra browser console cho frontend errors
3. Chạy test scripts để identify issues
4. Kiểm tra environment variables
5. Verify database connection

---

**Lưu ý**: Đây là hệ thống test cho development environment. Production deployment cần thêm các biện pháp bảo mật và monitoring.