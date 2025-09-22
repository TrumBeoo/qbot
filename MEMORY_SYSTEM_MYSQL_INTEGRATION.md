# Hệ thống Trí nhớ Chatbot với LangChain và MySQL

## Tổng quan

Hệ thống trí nhớ mới được tích hợp vào chatbot sử dụng các thành phần memory của LangChain (`MessagesPlaceholder`, `HumanMessage`, `AIMessage`) kết hợp với cơ sở dữ liệu MySQL để lưu trữ chat history và cung cấp khả năng ghi nhớ cuộc trò chuyện thông minh.

## Kiến trúc hệ thống

### 1. Các thành phần chính

#### Memory Service (`services/memory_service.py`)
- **MySQLChatMessageHistory**: Custom chat message history lưu trữ trong MySQL
- **MemoryService**: Quản lý các loại memory khác nhau
- **ConversationBufferWindowMemory**: Lưu N tin nhắn gần nhất
- **ConversationSummaryBufferMemory**: Tự động tóm tắt khi vượt quá giới hạn token

#### Enhanced RAG Service (`services/enhanced_rag_service.py`)
- **ConversationalRetrievalChain**: RAG với ngữ cảnh cuộc trò chuyện
- **Personalization**: Cá nhân hóa phản hồi dựa trên lịch sử
- **Follow-up Suggestions**: Gợi ý câu hỏi tiếp theo

#### Enhanced Chat Service (`services/enhanced_chat_service.py`)
- **Memory-aware Chat**: Chat với khả năng ghi nhớ
- **Context Management**: Quản lý ngữ cảnh cuộc trò chuyện
- **User Preferences**: Phân tích sở thích người dùng

### 2. Tích hợp MySQL

#### Custom Chat Message History
```python
class MySQLChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, conversation_id: str, user_id: str):
        self.conversation_id = conversation_id
        self.user_id = user_id
    
    def add_message(self, message: BaseMessage) -> None:
        # Lưu tin nhắn vào MySQL database
        
    @property
    def messages(self) -> List[BaseMessage]:
        # Tải tin nhắn từ MySQL database
```

#### Lưu trữ dữ liệu
- **Conversations**: Lưu thông tin cuộc trò chuyện
- **Messages**: Lưu chi tiết từng tin nhắn với sender, timestamp, language
- **Memory Cache**: Cache memory objects trong RAM để tăng hiệu suất

## Các tính năng chính

### 1. Loại Memory được hỗ trợ

#### Buffer Window Memory
```python
memory = ConversationBufferWindowMemory(
    chat_memory=MySQLChatMessageHistory(conversation_id, user_id),
    k=10,  # Giữ 10 tin nhắn gần nhất
    return_messages=True,
    memory_key="chat_history"
)
```

#### Summary Buffer Memory
```python
memory = ConversationSummaryBufferMemory(
    llm=ChatGroq(...),
    chat_memory=MySQLChatMessageHistory(conversation_id, user_id),
    max_token_limit=2000,
    return_messages=True,
    memory_key="chat_history"
)
```

### 2. RAG với Memory

#### Conversational Retrieval Chain
```python
chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    combine_docs_chain_kwargs={"prompt": custom_prompt},
    return_source_documents=True
)

result = chain({
    "question": query,
    "chat_history": chat_history  # Từ memory
})
```

### 3. Cá nhân hóa thông minh

#### Phân tích sở thích người dùng
- Ngôn ngữ ưa thích (vi/en)
- Chủ đề quan tâm (du lịch, ẩm thực, khách sạn...)
- Thời gian hoạt động (sáng, chiều, tối)
- Mẫu tương tác

#### Cá nhân hóa phản hồi
```python
def personalize_response(self, response: str, user_id: str, conversation_id: str) -> str:
    preferences = self.get_user_preferences(user_id)
    
    if preferences.get("common_topics"):
        top_topic = preferences["common_topics"][0]["topic"]
        if top_topic == "ha_long":
            response += "\n\n💡 Bạn có vẻ quan tâm đến Vịnh Hạ Long..."
    
    return response
```

## API Endpoints

### 1. Memory-Enhanced Chat

#### Chat với Memory
```http
POST /chat-with-memory
Authorization: Bearer <token>
Content-Type: application/json

{
    "message": "Tôi muốn đi du lịch Hạ Long",
    "conversation_id": "conv_123",
    "language": "vi",
    "memory_type": "buffer_window"
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "user_message": {
            "text": "Tôi muốn đi du lịch Hạ Long",
            "timestamp": "2024-01-15T10:30:00Z",
            "sender": "user"
        },
        "bot_response": {
            "text": "Vịnh Hạ Long là một điểm đến tuyệt vời...",
            "timestamp": "2024-01-15T10:30:05Z",
            "sender": "bot",
            "sources": [...],
            "suggestions": [
                "Bạn muốn đi bao nhiều ngày?",
                "Có cần gợi ý khách sạn không?"
            ]
        },
        "conversation_id": "conv_123",
        "memory_type": "buffer_window",
        "chat_history_length": 2
    },
    "language": "vi"
}
```

### 2. Memory Management

#### Lấy ngữ cảnh cuộc trò chuyện
```http
GET /api/memory/conversation-context/conv_123?memory_type=buffer_window
Authorization: Bearer <token>
```

#### Lấy sở thích người dùng
```http
GET /api/memory/user-preferences
Authorization: Bearer <token>
```

#### Xóa memory
```http
DELETE /api/memory/clear/conv_123?memory_type=buffer_window
Authorization: Bearer <token>
```

#### Thống kê memory
```http
GET /api/memory/stats?include_user=true
Authorization: Bearer <token>
```

#### Tóm tắt cuộc trò chuyện
```http
GET /api/memory/conversation-summary/conv_123?language=vi
Authorization: Bearer <token>
```

#### Gợi ý câu hỏi tiếp theo
```http
GET /api/memory/follow-up-suggestions/conv_123?language=vi
Authorization: Bearer <token>
```

#### Dọn dẹp memory cũ
```http
POST /api/memory/cleanup
Authorization: Bearer <token>
Content-Type: application/json

{
    "days_old": 30
}
```

## Cấu hình

### Environment Variables
```env
# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=chatbot

# Groq API for LLM
GROQ_API_KEY=your_groq_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret
```

### Memory Configuration
```python
# Trong memory_service.py
memory_service = MemoryService(
    window_size=10,           # Số tin nhắn giữ trong buffer window
    max_token_limit=2000,     # Giới hạn token cho summary buffer
    summary_threshold=1000    # Ngưỡng token để kích hoạt tóm tắt
)
```

## Cách sử dụng

### 1. Khởi tạo Memory System

```python
from services.memory_service import MemoryService
from services.enhanced_chat_service import EnhancedChatService

# Khởi tạo services
memory_service = MemoryService()
chat_service = EnhancedChatService()
```

### 2. Chat với Memory

```python
# Chat với buffer window memory
result = chat_service.chat_with_memory(
    conversation_id="conv_123",
    user_id="user_456",
    user_message="Tôi muốn đi du lịch Hạ Long",
    language="vi",
    memory_type="buffer_window"
)

# Chat tiếp theo sẽ có ngữ cảnh
followup_result = chat_service.chat_with_memory(
    conversation_id="conv_123",
    user_id="user_456",
    user_message="Có khách sạn nào gần bến tàu không?",
    language="vi",
    memory_type="buffer_window"
)
```

### 3. Quản lý Memory

```python
# Lấy ngữ cảnh cuộc trò chuyện
context = chat_service.get_conversation_context("conv_123", "user_456")

# Phân tích sở thích người dùng
preferences = chat_service.get_user_preferences("user_456")

# Xóa memory
chat_service.clear_conversation_memory("conv_123", "user_456")
```

## Ví dụ thực tế

### Cuộc trò chuyện có ngữ cảnh:

**Tin nhắn 1:**
```
User: "Tôi muốn đi du lịch Hạ Long"
Bot: "Vịnh Hạ Long là một điểm đến tuyệt vời! Bạn dự định đi bao nhiều ngày?"
```

**Tin nhắn 2:**
```
User: "2 ngày 1 đêm"
Bot: "Với 2 ngày 1 đêm tại Hạ Long, tôi gợi ý lịch trình sau..."
(Bot nhớ được thông tin trước đó về Hạ Long)
```

**Tin nhắn 3:**
```
User: "Có khách sạn nào gần bến tàu không?"
Bot: "Dựa trên lịch trình 2 ngày 1 đêm tại Hạ Long mà chúng ta đã thảo luận..."
(Bot sử dụng ngữ cảnh từ memory)
```

### Cá nhân hóa:

Nếu người dùng thường hỏi về Hạ Long, bot sẽ tự động gợi ý:
```
"Bạn có vẻ quan tâm đến Vịnh Hạ Long. Tôi có thể chia sẻ thêm thông tin về địa điểm này nếu bạn muốn!"
```

## Testing

### Chạy test memory system:
```bash
cd backend
python test_memory_system.py
```

### Test các thành phần:
- ✅ Memory Service: Basic memory operations
- ✅ MySQL Integration: Database storage
- ✅ Enhanced RAG Service: RAG with memory
- ✅ Enhanced Chat Service: Complete chat with memory

## Lợi ích

### 1. Trải nghiệm người dùng tốt hơn
- Bot nhớ được ngữ cảnh cuộc trò chuyện
- Không cần lặp lại thông tin
- Phản hồi phù hợp với sở thích cá nhân
- Gợi ý câu hỏi tiếp theo thông minh

### 2. Hiệu suất cao
- Caching memory objects trong RAM
- Tối ưu hóa truy vấn MySQL
- Quản lý memory tự động
- Fallback mechanism khi có lỗi

### 3. Khả năng mở rộng
- Hỗ trợ nhiều loại memory
- Dễ dàng thêm tính năng mới
- Tích hợp với các hệ thống khác
- Monitoring và debugging

### 4. Tích hợp MySQL
- Lưu trữ persistent trong database
- Khả năng phân tích dữ liệu
- Backup và recovery
- Scalability

## Monitoring và Debugging

### Memory Statistics
```python
stats = chat_service.get_memory_stats("user_456")
# Trả về: active_memories, total_conversations, total_messages, etc.
```

### Logging
- Tất cả hoạt động memory được log
- Theo dõi hiệu suất và lỗi
- Debug conversation flow
- MySQL query monitoring

## Bảo trì

### Cleanup tự động
```python
# Xóa memory cache cũ hơn 30 ngày
chat_service.cleanup_old_memories(days_old=30)
```

### Monitoring
- Theo dõi kích thước memory cache
- Kiểm tra hiệu suất MySQL
- Phân tích usage patterns
- Memory leak detection

## Kết luận

Hệ thống memory mới với tích hợp MySQL cung cấp khả năng trí nhớ thông minh và persistent cho chatbot. Sử dụng các thành phần LangChain như `MessagesPlaceholder`, `HumanMessage`, `AIMessage` kết hợp với MySQL storage, hệ thống có thể:

- Duy trì ngữ cảnh cuộc trò chuyện qua các phiên
- Cá nhân hóa phản hồi dựa trên lịch sử
- Cung cấp gợi ý thông minh
- Lưu trữ dữ liệu persistent
- Phân tích sở thích người dùng
- Tối ưu hóa hiệu suất

Hệ thống được thiết kế để có hiệu suất cao, khả năng mở rộng tốt và dễ dàng bảo trì, cải thiện đáng kể trải nghiệm người dùng khi tương tác với chatbot.