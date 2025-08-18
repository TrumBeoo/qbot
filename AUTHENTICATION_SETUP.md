# Authentication System Setup Guide

## 🔧 Backend Configuration

### 1. Environment Variables
Update `backend/.env` with your credentials:

```env
# Database
MONGO_URI=mongodb://localhost:27017/chatbot_AI

# Authentication
JWT_SECRET=your-secure-jwt-secret-key-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (Optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# AI Service
GROQ_API_KEY=your_groq_api_key
```

### 2. Database Setup
```bash
cd backend
python setup_db.py
```

### 3. Install Dependencies
```bash
pip install -r requirements_clean.txt
```

### 4. Start Backend
```bash
python app.py
```

## 🎨 Frontend Configuration

### 1. Environment Variables
Update `frontend/.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook OAuth Configuration  
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Frontend
```bash
npm run dev
```

## 🔑 OAuth Setup (Optional)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:5173` (development)
   - Your production domain
6. Copy Client ID to both backend and frontend `.env` files

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs:
   - `http://localhost:5173` (development)
   - Your production domain
5. Copy App ID and App Secret to `.env` files

## 🚀 Features

### ✅ Email/Password Authentication
- User registration with validation
- Secure login with JWT tokens
- Password hashing with bcrypt
- Form validation on both frontend and backend

### ✅ Social Login Integration
- Google OAuth 2.0
- Facebook Login
- Automatic account creation/linking
- Profile picture sync

### ✅ Chat History Management
- Persistent conversation storage
- Message history with timestamps
- Conversation search and export
- User-specific data isolation

### ✅ Security Features
- JWT token authentication
- Password strength validation
- Input sanitization
- CORS protection
- MongoDB injection prevention

## 🧪 Testing

### Test Authentication System
```bash
cd backend
python test_refactored_system.py
```

### Manual Testing Checklist

#### Registration
- [ ] Register with valid email/password
- [ ] Validate email format
- [ ] Check password strength requirements
- [ ] Verify account creation in database

#### Login
- [ ] Login with correct credentials
- [ ] Handle invalid credentials
- [ ] JWT token generation and storage
- [ ] User session persistence

#### Social Login
- [ ] Google OAuth flow
- [ ] Facebook OAuth flow
- [ ] Account linking for existing emails
- [ ] Profile data sync

#### Chat History
- [ ] Create new conversation
- [ ] Save messages to conversation
- [ ] Load conversation history
- [ ] Search conversations
- [ ] Delete conversations

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# MongoDB connection error
- Check MongoDB is running
- Verify MONGO_URI in .env
- Run: python setup_db.py

# JWT token errors
- Ensure JWT_SECRET is set
- Check token expiration
- Verify token format

# OAuth errors
- Check client IDs/secrets
- Verify redirect URIs
- Enable required APIs
```

#### Frontend Issues
```bash
# Environment variables not loading
- Ensure variables start with VITE_
- Restart development server
- Check .env file location

# OAuth not working
- Check client IDs match backend
- Verify domain configuration
- Check browser console for errors

# API connection errors
- Verify VITE_API_BASE_URL
- Check backend is running
- Verify CORS configuration
```

## 📊 API Endpoints

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
POST /api/auth/google-login - Google OAuth
POST /api/auth/facebook-login - Facebook OAuth
POST /api/auth/verify-token - Verify JWT token
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update profile
```

### Chat Management
```
GET    /api/chat/conversations           - Get conversations
POST   /api/chat/conversations           - Create conversation
GET    /api/chat/conversations/{id}      - Get conversation
PUT    /api/chat/conversations/{id}      - Update conversation
DELETE /api/chat/conversations/{id}      - Delete conversation
POST   /api/chat/conversations/{id}/messages - Add message
GET    /api/chat/search?q={query}       - Search conversations
GET    /api/chat/export                 - Export conversations
GET    /api/chat/stats                  - Get statistics
```

### Chat Endpoints
```
POST /chat                    - Public chat (no auth)
POST /chat-authenticated      - Authenticated chat (saves history)
POST /voice-chat              - Public voice chat
POST /voice-chat-authenticated - Authenticated voice chat
```

## 🔒 Security Best Practices

### Backend Security
- Use strong JWT secrets (32+ characters)
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Regular security updates

### Frontend Security
- Store tokens securely
- Validate user inputs
- Use HTTPS for OAuth redirects
- Implement CSP headers
- Regular dependency updates

### Database Security
- Use MongoDB authentication
- Implement proper indexes
- Regular backups
- Monitor access logs
- Use connection encryption

## 🚀 Production Deployment

### Backend Deployment
```bash
# Set production environment variables
export NODE_ENV=production
export MONGO_URI=mongodb://production-server/chatbot_AI
export JWT_SECRET=your-production-jwt-secret

# Use production WSGI server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
# Deploy dist/ folder to your web server
```

### Environment Variables for Production
- Use secure, randomly generated JWT secrets
- Use production MongoDB instance
- Configure production OAuth redirect URIs
- Enable HTTPS for all endpoints
- Set up proper CORS origins

## 📈 Monitoring

### Key Metrics to Monitor
- User registration/login rates
- Authentication success/failure rates
- Chat message volume
- API response times
- Database connection health
- OAuth success rates

### Logging
- Authentication events
- API requests/responses
- Database operations
- Error tracking
- Performance metrics