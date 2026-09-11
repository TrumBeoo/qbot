# Hệ thống Trí nhớ Chatbot với LangChain

## Tổng quan

Hệ thống trí nhớ mới được tích hợp vào chatbot sử dụng các thành phần memory của LangChain để cung cấp khả năng ghi nhớ cuộc trò chuyện, cá nhân hóa phản hồi và duy trì ngữ cảnh qua các phiên chat.

## Các tính năng chính

### 1. Loại Memory được hỗ trợ

#### Buffer Window Memory
- Lưu trữ N tin nhắn gần nhất trong bộ nhớ
- Phù hợp cho cuộc trò chuyện ngắn
- Hiệu suất cao, sử dụng ít tài nguyên

#### Summary Buffer Memory  
- Tự động tóm tắt các tin nhắn cũ khi vượt quá giới hạn token
- Duy trì ngữ cảnh dài hạn
- Sử dụng LLM để tạo tóm tắt thông minh

### 2. Lưu trữ Memory

#### MongoDB Integration
- Lưu trữ lịch sử chat trong MongoDB
- Hỗ trợ truy vấn và phân tích dữ liệu
- Khả năng mở rộng cao

#### In-Memory Caching
- Cache memory objects để tăng hiệu suất
- Giảm thời gian phản hồi
- Tự động quản lý cache

### 3. Cá nhân hóa

#### User Preferences Analysis
- Phân tích sở thích người dùng từ lịch sử chat
- Xác định ngôn ngữ ưa thích
- Nhận diện chủ đề quan tâm

#### Response Personalization
- Tùy chỉnh phản hồi dựa trên sở thích
- Gợi ý nội dung liên quan
- Cải thiện trải nghiệm người dùng

## Cấu trúc Code

### Memory Service (`services/memory_service.py`)

```python
class MemoryService:
    def __init__(self, window_size=10, max_token_limit=2000):
        # Khởi tạo service với cấu hình memory
        
    def get_conversation_memory(self, conversation_id, user_id, memory_type):
        # Tạo hoặc lấy memory instance cho cuộc trò chuyện
        
    def add_message_to_memory(self, conversation_id, user_id, user_message, bot_response):
        # Thêm tin nhắn vào memory
        
    def get_user_preferences(self, user_id):
        # Phân tích và trả về sở thích người dùng
        
    def personalize_response(self, response, user_id, conversation_id):
        # Cá nhân hóa phản hồi của bot
```

### Enhanced RAG Engine

```python
class RAGEngine:
    def ask_question_with_memory(self, query, conversation_memory, language):
        # Trả lời câu hỏi với ngữ cảnh từ memory
        # Sử dụng ConversationalRetrievalChain
```

### Enhanced Chat Service

```python
class ChatService:
    def chat_with_memory(self, conversation_id, user_id, user_message, language, memory_type):
        # Chat với tích hợp memory
        # Kết hợp RAG + Memory + Personalization
```

## API Endpoints

### Memory-Enhanced Chat
```
POST /chat-with-memory
```
**Request:**
```json
{
    "message": "Tôi muốn đi du lịch Hạ Long",
    "language": "vi",
    "conversation_id": "conv_123",
    "memory_type": "buffer_window"
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "user_message": {...},
        "bot_response": {...},
        "conversation_id": "conv_123",
        "memory_type": "buffer_window"
    },
    "language": "vi"
}
```

### Memory Management

#### Get Conversation Context
```
GET /api/memory/conversation-context/{conversation_id}?memory_type=buffer_window
```

#### Get User Preferences
```
GET /api/memory/user-preferences
```

#### Clear Conversation Memory
```
DELETE /api/memory/clear/{conversation_id}
```

#### Memory Statistics
```
GET /api/memory/stats
```

#### Cleanup Old Memories
```
POST /api/memory/cleanup
{
    "days_old": 30
}
```

## Cấu hình

### Environment Variables

```env
# MongoDB connection for memory storage
MONGODB_URI=mongodb://localhost:27017/chatbot

# Groq API for LLM operations
GROQ_API_KEY=your_groq_api_key
```

### Memory Configuration

```python
# Trong memory_service.py
memory_service = MemoryService(
    window_size=10,           # Số tin nhắn giữ trong buffer
    max_token_limit=2000,     # Giới hạn token cho summary buffer
    summary_threshold=1000    # Ngưỡng token để kích hoạt tóm tắt
)
```

## Cách sử dụng

### 1. Chat thông thường (không memory)
```python
# Sử dụng endpoint /chat-authenticated
response = ask_question(message, language)
```

### 2. Chat với memory
```python
# Sử dụng endpoint /chat-with-memory
result = ChatService.chat_with_memory(
    conversation_id, user_id, message, language, memory_type
)
```

### 3. Quản lý memory
```python
# Lấy ngữ cảnh cuộc trò chuyện
context = ChatService.get_conversation_context(conversation_id, user_id)

# Lấy sở thích người dùng
preferences = ChatService.get_user_preferences(user_id)

# Xóa memory
ChatService.clear_conversation_memory(conversation_id)
```

## Lợi ích

### 1. Trải nghiệm người dùng tốt hơn
- Bot nhớ được ngữ cảnh cuộc trò chuyện
- Không cần lặp lại thông tin
- Phản hồi phù hợp với sở th��ch cá nhân

### 2. Hiệu suất cao
- Caching thông minh
- Tối ưu hóa truy vấn database
- Quản lý memory tự động

### 3. Khả năng mở rộng
- Hỗ trợ nhiều loại memory
- Dễ dàng thêm tính năng mới
- Tích hợp với các hệ thống khác

## Ví dụ thực tế

### Cuộc trò chuyện có ngữ cảnh:

**User:** "Tôi muốn đi du lịch Hạ Long"
**Bot:** "Vịnh Hạ Long là một điểm đến tuyệt vời! Bạn dự định đi bao nhiều ngày?"

**User:** "2 ngày 1 đêm"
**Bot:** "Với 2 ngày 1 đêm tại Hạ Long, tôi gợi ý lịch trình sau..." 
*(Bot nhớ được thông tin trước đó về Hạ Long)*

**User:** "Có khách sạn nào gần bến tàu không?"
**Bot:** "Dựa trên lịch trình 2 ngày 1 đêm tại Hạ Long mà chúng ta đã thảo luận..."
*(Bot sử dụng ngữ cảnh từ memory)*

### Cá nhân hóa:

Nếu người dùng thường hỏi về Hạ Long, bot sẽ tự động gợi ý:
"Bạn có vẻ quan tâm đến Vịnh Hạ Long. Tôi có thể chia sẻ thêm thông tin về địa điểm này nếu bạn muốn!"

## Monitoring và Debugging

### Memory Statistics
```python
stats = ChatService.get_memory_stats(user_id)
# Trả về: active_memories, total_conversations, total_messages, etc.
```

### Logging
- Tất cả hoạt động memory được log
- Theo dõi hiệu suất và lỗi
- Debug conversation flow

## Bảo trì

### Cleanup tự động
```python
# Xóa memory cũ hơn 30 ngày
ChatService.cleanup_old_memories(days_old=30)
```

### Monitoring
- Theo dõi kích thước memory cache
- Kiểm tra hiệu suất database
- Phân tích usage patterns

## Kết luận

Hệ thống memory mới cung cấp khả năng trí nhớ thông minh cho chatbot, cải thiện đáng kể trải nghiệm người dùng thông qua việc duy trì ngữ cảnh cuộc trò chuyện và cá nhân hóa phản hồi. Hệ thống được thiết kế để có hiệu suất cao, khả năng mở rộng tốt và dễ dàng bảo trì.