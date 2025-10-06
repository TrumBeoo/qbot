# Hệ Thống Database Hybrid - MongoDB + MySQL

## Tổng Quan

Hệ thống chatbot đã được tách rõ mục tiêu sử dụng 2 database:

### A. MySQL - Quản lý & Báo cáo
- **Mục đích**: Lưu trữ dữ liệu có cấu trúc cho báo cáo và phân tích
- **Dữ liệu**: Conversations, Messages, Users, Analytics
- **Ưu điểm**: ACID compliance, complex queries, reporting tools

### B. MongoDB - Phục vụ Chatbot
- **Mục đích**: Lưu trữ dữ liệu linh hoạt cho chatbot real-time
- **Dữ liệu**: Chat history (document-based), Context vectors, Session state
- **Ưu điểm**: Flexible schema, fast reads, embedding storage

## Cấu Trúc MongoDB Collection

### Collection: `chat_history`

Mỗi document = 1 conversation với cấu trúc:

```json
{
  "conversation_id": "ObjectId",
  "user_id": "string",
  "title": "string",
  "messages": [
    {
      "message_id": "string",
      "role": "user|bot",
      "content": "string",
      "timestamp": "ISODate",
      "metadata": {
        "language": "vi|en",
        "response_time": "number",
        "confidence": "number",
        "tokens_used": "number",
        "model_version": "string",
        "rag_sources": ["array"]
      }
    }
  ],
  "context_vector": [0.123, 0.456, ...],
  "session_state": {
    "active": true,
    "last_activity": "ISODate",
    "message_count": "number",
    "language": "vi|en"
  },
  "metadata": {
    "created_at": "ISODate",
    "updated_at": "ISODate",
    "device_info": "string",
    "user_agent": "string",
    "ip_address": "string",
    "tags": ["array"]
  },
  "analytics": {
    "total_user_messages": "number",
    "total_bot_messages": "number",
    "avg_response_time": "number",
    "user_satisfaction": "number",
    "topics": ["array"]
  }
}
```

## API Endpoints

### MongoDB Chat API (`/api/mongodb`)

#### 1. Tạo Conversation
```http
POST /api/mongodb/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Conversation",
  "language": "vi",
  "metadata": {
    "tags": ["tourism", "quang-ninh"]
  }
}
```

#### 2. Gửi Message
```http
POST /api/mongodb/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Xin chào, tôi muốn hỏi về du lịch Hạ Long",
  "language": "vi"
}
```

#### 3. Lấy Conversation
```http
GET /api/mongodb/conversations/{conversation_id}?source=mongodb
Authorization: Bearer <token>
```

#### 4. Lấy Danh Sách Conversations
```http
GET /api/mongodb/conversations?limit=50&skip=0&source=mongodb
Authorization: Bearer <token>
```

#### 5. Tìm Kiếm
```http
GET /api/mongodb/conversations/search?q=Hạ Long&limit=20&source=mongodb
Authorization: Bearer <token>
```

#### 6. Analytics
```http
GET /api/mongodb/analytics?source=both
Authorization: Bearer <token>
```

#### 7. Sync sang MySQL
```http
POST /api/mongodb/conversations/{conversation_id}/sync
Authorization: Bearer <token>
```

### Data Management API

#### 8. Sync Data Files
```http
POST /api/mongodb/data/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "data.txt"  // Optional, sync all if not provided
}
```

#### 9. Get Sync Status
```http
GET /api/mongodb/data/sync-status
Authorization: Bearer <token>
```

## Workflow Hoạt Động

### 1. Chatbot Real-time Flow
```
User Message → MongoDB (fast write) → RAG Engine → Bot Response → MongoDB (update)
                ↓ (async)
              MySQL (sync for reporting)
```

### 2. Reporting Flow
```
Dashboard → MySQL (structured queries) → Analytics & Reports
```

### 3. Context Flow
```
New Message → MongoDB (get context) → RAG (with history) → Enhanced Response
```

## Services Architecture

### 1. MongoDBChatService
- Quản lý chat_history collection
- CRUD operations cho conversations
- Context management cho chatbot
- Analytics real-time

### 2. HybridChatService
- Kết hợp MongoDB + MySQL
- Async sync giữa 2 databases
- RAG integration
- Error handling & fallback

### 3. EnhancedRAGService
- RAG engine với memory
- Context-aware responses
- Multi-language support
- Source tracking

## Cách Sử Dụng

### 1. Khởi Tạo Conversation (Frontend)
```javascript
const response = await fetch('/api/mongodb/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Du lịch Quảng Ninh',
    language: 'vi'
  })
});

const { conversation_id } = await response.json();
```

### 2. Gửi Message
```javascript
const response = await fetch(`/api/mongodb/conversations/${conversation_id}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hạ Long có gì hay?',
    language: 'vi'
  })
});

const { user_message, bot_response } = await response.json();
```

### 3. Lấy History
```javascript
const response = await fetch(`/api/mongodb/conversations/${conversation_id}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log(data.messages); // All messages in conversation
```

## Monitoring & Analytics

### 1. Real-time Metrics (MongoDB)
- Active conversations
- Response times
- User engagement
- Context effectiveness

### 2. Historical Reports (MySQL)
- Conversation trends
- User behavior analysis
- Content performance
- System usage statistics

## Performance Optimization

### 1. MongoDB Indexes
```javascript
// Recommended indexes
db.chat_history.createIndex({ "user_id": 1, "metadata.updated_at": -1 });
db.chat_history.createIndex({ "session_state.active": 1 });
db.chat_history.createIndex({ "messages.content": "text" });
```

### 2. Caching Strategy
- Conversation context caching
- RAG response caching
- User preference caching

### 3. Async Operations
- Background MySQL sync
- Context vector updates
- Analytics calculations

## Error Handling

### 1. MongoDB Unavailable
- Fallback to MySQL for basic chat
- Queue operations for retry
- User notification

### 2. MySQL Sync Failure
- Continue with MongoDB
- Log for manual sync
- Background retry

### 3. RAG Service Error
- Fallback to simple responses
- Error logging
- User-friendly messages

## Migration & Backup

### 1. Data Migration
```python
# Sync existing MySQL data to MongoDB
from services.hybrid_chat_service import hybrid_chat_service

# Migrate specific conversation
await hybrid_chat_service.sync_conversation_to_mysql(conversation_id, user_id)
```

### 2. Backup Strategy
- MongoDB: Regular dumps + replica sets
- MySQL: Traditional backup + replication
- Cross-database consistency checks

## Development Guidelines

### 1. Adding New Features
- MongoDB first for real-time features
- MySQL for reporting features
- Consider sync requirements

### 2. Testing
- Unit tests for each service
- Integration tests for hybrid operations
- Performance tests for both databases

### 3. Deployment
- MongoDB cluster setup
- MySQL master-slave configuration
- Connection pooling
- Health checks

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check MongoDB URI in .env
   - Verify MySQL credentials
   - Test network connectivity

2. **Sync Issues**
   - Check async task queue
   - Verify data consistency
   - Manual sync if needed

3. **Performance Issues**
   - Monitor database metrics
   - Check index usage
   - Optimize queries

### Debug Commands

```bash
# Check MongoDB connection
python -c "from MongoDB.db import db; print(db.command('ping'))"

# Check MySQL connection
python -c "from MySQL.db import get_mysql_connection; conn = get_mysql_connection(); print('OK')"

# Test hybrid service
python -c "from services.hybrid_chat_service import hybrid_chat_service; print('Loaded')"
```

## Kết Luận

Hệ thống hybrid này cung cấp:
- **Tốc độ**: MongoDB cho chatbot real-time
- **Báo cáo**: MySQL cho analytics chi tiết
- **Linh hoạt**: Document-based cho AI features
- **Ổn định**: Structured data cho business logic
- **Mở rộng**: Dễ dàng scale từng database riêng biệt

Hệ thống được thiết kế để tận dụng ưu điểm của cả hai loại database, đảm bảo hiệu suất tối ưu cho cả chatbot và reporting.