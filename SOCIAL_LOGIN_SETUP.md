# Social Login Configuration Guide

## Tổng quan
Hướng dẫn cấu hình Google OAuth và Facebook Login cho Dashboard.

## 1. Google OAuth Setup

### Bước 1: Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable Google+ API và Google Identity Services

### Bước 2: Tạo OAuth 2.0 Credentials
1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Chọn **Web application**
4. Thêm **Authorized JavaScript origins**:
   - `http://localhost:5175`
   - `http://localhost:3000`
   - Domain production của bạn
5. Thêm **Authorized redirect URIs**:
   - `http://localhost:5175/auth/callback`
   - Domain production callback URL

### Bước 3: Cấu hình .env
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 2. Facebook Login Setup

### Bước 1: Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Click **Create App** > **Consumer**
3. Nhập tên app và email liên hệ

### Bước 2: Cấu hình Facebook Login
1. Vào **Products** > **Facebook Login** > **Settings**
2. Thêm **Valid OAuth Redirect URIs**:
   - `http://localhost:5175/`
   - Domain production của bạn
3. Thêm **Valid JavaScript Origins**:
   - `http://localhost:5175`
   - Domain production của bạn

### Bước 3: Cấu hình .env
```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## 3. Backend Configuration

### Cập nhật backend .env
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth  
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## 4. Testing

### Test Google Login
1. Mở Dashboard tại `http://localhost:5175`
2. Click nút "Google" trên trang login
3. Chọn tài khoản Google
4. Kiểm tra redirect về dashboard

### Test Facebook Login
1. Click nút "Facebook" trên trang login
2. Đăng nhập Facebook
3. Cấp quyền cho app
4. Kiểm tra redirect về dashboard

## 5. Troubleshooting

### Google OAuth Issues
- **Error 400: redirect_uri_mismatch**
  - Kiểm tra Authorized redirect URIs trong Google Console
  - Đảm bảo URL chính xác (có/không có trailing slash)

- **Error: popup_closed_by_user**
  - User đã đóng popup trước khi hoàn thành
  - Không cần xử lý đặc biệt

### Facebook Login Issues
- **Error: App Not Setup**
  - Kiểm tra Facebook App ID trong .env
  - Đảm bảo app đã được publish (cho production)

- **Error: Invalid Scope**
  - Kiểm tra permissions trong Facebook App settings
  - Đảm bảo 'email' permission được enable

### Common Issues
- **CORS Errors**
  - Kiểm tra domain trong OAuth settings
  - Đảm bảo localhost được whitelist

- **Token Verification Failed**
  - Kiểm tra backend có nhận được token
  - Verify Google/Facebook API credentials

## 6. Security Notes

### Production Checklist
- [ ] Sử dụng HTTPS cho production
- [ ] Cập nhật OAuth redirect URIs cho production domain
- [ ] Không commit .env files vào git
- [ ] Sử dụng environment variables trên server
- [ ] Enable rate limiting cho auth endpoints
- [ ] Monitor failed login attempts

### Best Practices
- Sử dụng separate OAuth apps cho dev/staging/production
- Regularly rotate client secrets
- Monitor OAuth usage trong console
- Implement proper error handling
- Log authentication events

## 7. File Structure

```
Dashboard/
├── src/
│   ├── .env                     # Environment variables
│   ├── .env.example            # Template for .env
│   ├── components/auth/
│   │   ├── GoogleLoginButton.jsx
│   │   └── FacebookLoginButton.jsx
│   └── utils/
│       └── facebookSDK.js      # Dynamic Facebook SDK loader
└── index.html                  # Google Identity Services script
```

## 8. Environment Variables Reference

### Frontend (.env)
```env
# Required
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# Optional
VITE_APP_NAME=ServiceHub
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```env
# Required for social login
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```