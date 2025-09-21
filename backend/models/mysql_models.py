from datetime import datetime
import uuid

class MySQLMessage:
    def __init__(self, text, sender, language='vi', timestamp=None, conversation_id=None, message_id=None):
        self.id = message_id or str(uuid.uuid4())
        self.conversation_id = conversation_id
        self.text = text
        self.sender = sender  # 'user' or 'bot'
        self.language = language
        self.timestamp = timestamp or datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'text': self.text,
            'sender': self.sender,
            'language': self.language,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            text=data['text'],
            sender=data['sender'],
            language=data.get('language', 'vi'),
            timestamp=data.get('timestamp'),
            conversation_id=data.get('conversation_id'),
            message_id=data.get('id')
        )

class MySQLConversation:
    def __init__(self, user_id, title="New Conversation", conversation_id=None):
        self.id = conversation_id or str(uuid.uuid4())
        self.user_id = user_id
        self.title = title
        self.messages = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def add_message(self, text, sender, language='vi'):
        """Add a message to the conversation"""
        message = MySQLMessage(text, sender, language, conversation_id=self.id)
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message
    
    def add_message_pair(self, user_text, bot_response, language='vi'):
        """Add user message and bot response"""
        timestamp = datetime.utcnow()
        
        user_msg = MySQLMessage(user_text, 'user', language, timestamp, self.id)
        bot_msg = MySQLMessage(bot_response, 'bot', language, timestamp, self.id)
        
        self.messages.extend([user_msg, bot_msg])
        self.updated_at = timestamp
        
        return user_msg, bot_msg
    
    def get_message_count(self):
        """Get total message count"""
        return len(self.messages)
    
    def to_dict(self, include_messages=True):
        """Convert conversation to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'message_count': self.get_message_count()
        }
        
        if include_messages:
            data['messages'] = [msg.to_dict() for msg in self.messages]
        
        return data
    
    def to_db_dict(self):
        """Convert conversation to database format"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data, messages=None):
        """Create conversation from dictionary"""
        conv = cls(
            user_id=data['user_id'],
            title=data.get('title', 'New Conversation'),
            conversation_id=data.get('id')
        )
        
        conv.created_at = data.get('created_at', datetime.utcnow())
        conv.updated_at = data.get('updated_at', datetime.utcnow())
        
        # Load messages if provided
        if messages:
            conv.messages = [MySQLMessage.from_dict(msg_data) for msg_data in messages]
        
        return conv

class MySQLChatHistory:
    """Model cho bảng chat_history (legacy support)"""
    def __init__(self, user_id, user_message, bot_response, language='vi', conversation_id=None, chat_id=None):
        self.id = chat_id or str(uuid.uuid4())
        self.user_id = user_id
        self.conversation_id = conversation_id
        self.user_message = user_message
        self.bot_response = bot_response
        self.language = language
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'conversation_id': self.conversation_id,
            'user_message': self.user_message,
            'bot_response': self.bot_response,
            'language': self.language,
            'created_at': self.created_at
        }
    
    def to_db_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'conversation_id': self.conversation_id,
            'user_message': self.user_message,
            'bot_response': self.bot_response,
            'language': self.language,
            'created_at': self.created_at
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            user_id=data['user_id'],
            user_message=data['user_message'],
            bot_response=data['bot_response'],
            language=data.get('language', 'vi'),
            conversation_id=data.get('conversation_id'),
            chat_id=data.get('id')
        )