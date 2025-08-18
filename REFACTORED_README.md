# Chatbot Application - Refactored Architecture

## 🏗️ Architecture Overview

The application has been refactored with a clean, maintainable architecture:

```
backend/
├── models/           # Data models (User, Conversation, Message)
├── repositories/     # Database access layer
├── services/         # Business logic layer
├── db/              # Database connection
├── auth.py          # Authentication routes
├── chat_history.py  # Chat management routes
└── app.py           # Main application
```

## 🔧 New Features

### Authentication System
- ✅ Email/Password registration and login
- ✅ Google OAuth integration
- ✅ Facebook OAuth integration
- ✅ JWT token-based authentication
- ✅ User profile management
- ✅ Password validation and security

### Chat History Management
- ✅ MongoDB integration for persistent storage
- ✅ Conversation management (create, read, update, delete)
- ✅ Message history with timestamps
- ✅ Search functionality across conversations
- ✅ Export conversations to JSON
- ✅ Conversation statistics

### Database Layer
- ✅ Clean model separation (User, Conversation, Message)
- ✅ Repository pattern for database operations
- ✅ Optimized MongoDB indexes
- ✅ Data validation and error handling

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements_clean.txt
```

#### Configure Environment
Update `.env` file with your credentials:
```env
# Database
MONGO_URI=mongodb://localhost:27017/chatbot_AI

# Authentication
JWT_SECRET=your-secure-jwt-secret-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# AI Service
GROQ_API_KEY=your_groq_api_key
```

#### Setup Database
```bash
# Start MongoDB service
# Then run the setup script
python setup_db.py
```

#### Start Backend Server
```bash
python app.py
```

### 2. Frontend Setup

The frontend remains the same but now supports:
- User authentication with persistent sessions
- Chat history management
- Conversation switching
- Profile management

```bash
cd frontend
npm install
npm run dev
```

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /google-login` - Google OAuth login
- `POST /facebook-login` - Facebook OAuth login
- `POST /verify-token` - Verify JWT token
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /logout` - Logout user

### Chat Management (`/api/chat`)
- `GET /conversations` - Get user conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/{id}` - Get specific conversation
- `PUT /conversations/{id}` - Update conversation
- `DELETE /conversations/{id}` - Delete conversation
- `POST /conversations/{id}/messages` - Add message to conversation
- `DELETE /conversations/{id}/messages/{msg_id}` - Delete message
- `GET /search?q={query}` - Search conversations
- `GET /export` - Export all conversations
- `GET /stats` - Get conversation statistics

### Chat (`/chat` and `/chat-authenticated`)
- `POST /chat` - Public chat (no auth required)
- `POST /chat-authenticated` - Authenticated chat (saves to history)
- `POST /voice-chat` - Public voice chat
- `POST /voice-chat-authenticated` - Authenticated voice chat

## 🔒 Security Features

### Authentication
- JWT tokens with expiration
- Password hashing with bcrypt
- OAuth integration with Google/Facebook
- Token validation middleware

### Data Protection
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration
- Error handling without data leakage

## 📱 Frontend Integration

### AuthContext Usage
```javascript
import { useAuth } from '../contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

### Chat History Service
```javascript
import { chatHistoryService } from '../services/chatHistoryService';

// Create conversation
const conversation = await chatHistoryService.createConversation('My Chat');

// Add message
await chatHistoryService.addMessage(conversationId, userMessage, botResponse);

// Get conversations
const conversations = await chatHistoryService.getConversations();
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (hashed),
  provider: String ('email', 'google', 'facebook'),
  google_id: String (optional),
  facebook_id: String (optional),
  profile_picture: String (optional),
  is_active: Boolean,
  created_at: Date,
  updated_at: Date,
  last_login: Date
}
```

### Chat History Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  title: String,
  messages: [{
    _id: ObjectId,
    text: String,
    sender: String ('user', 'bot'),
    timestamp: Date,
    language: String
  }],
  created_at: Date,
  updated_at: Date
}
```

## 🔧 Development

### Adding New Features

1. **Models**: Define data structure in `models/`
2. **Repository**: Add database operations in `repositories/`
3. **Service**: Implement business logic in `services/`
4. **Routes**: Create API endpoints in route files
5. **Frontend**: Update services and components

### Testing

```bash
# Test API endpoints
python test_api.py

# Test database setup
python setup_db.py
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file
   - Run `python setup_db.py` to test connection

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check OAuth credentials for social login
   - Clear browser localStorage if needed

3. **Chat History Not Saving**
   - Ensure user is authenticated
   - Check conversation_id is valid
   - Verify database permissions

### Performance Optimization

- Database indexes are automatically created
- Use pagination for large conversation lists
- Implement message caching for active conversations
- Consider MongoDB connection pooling for high traffic

## 📈 Monitoring

### Database Indexes
The system automatically creates these indexes:
- Users: email (unique), google_id, facebook_id, provider
- Chat: user_id + updated_at, user_id + title (text), user_id + messages.text (text)

### Logging
- Authentication events
- Database operations
- API request/response times
- Error tracking with stack traces

## 🔄 Migration from Old System

If migrating from the previous version:

1. Backup existing data
2. Run database setup script
3. Update environment variables
4. Test authentication flow
5. Verify chat history functionality

The system maintains backward compatibility with existing chat endpoints while adding new authenticated features.