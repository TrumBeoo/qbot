from datetime import datetime
from bson import ObjectId

class Message:
    def __init__(self, text, sender, language='vi', timestamp=None):
        self._id = ObjectId()
        self.text = text
        self.sender = sender  # 'user' or 'bot'
        self.language = language
        self.timestamp = timestamp or datetime.utcnow()
    
    def to_dict(self):
        return {
            '_id': self._id,
            'text': self.text,
            'sender': self.sender,
            'language': self.language,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data):
        msg = cls(
            text=data['text'],
            sender=data['sender'],
            language=data.get('language', 'vi'),
            timestamp=data.get('timestamp', datetime.utcnow())
        )
        if '_id' in data:
            msg._id = data['_id']
        return msg

class Conversation:
    def __init__(self, user_id, title="New Conversation"):
        self._id = None
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.title = title
        self.messages = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def add_message(self, text, sender, language='vi'):
        """Add a message to the conversation"""
        message = Message(text, sender, language)
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message
    
    def add_message_pair(self, user_text, bot_response, language='vi'):
        """Add user message and bot response"""
        timestamp = datetime.utcnow()
        
        user_msg = Message(user_text, 'user', language, timestamp)
        bot_msg = Message(bot_response, 'bot', language, timestamp)
        
        self.messages.extend([user_msg, bot_msg])
        self.updated_at = timestamp
        
        return user_msg, bot_msg
    
    def get_message_count(self):
        """Get total message count"""
        return len(self.messages)
    
    def to_dict(self, include_messages=True):
        """Convert conversation to dictionary"""
        data = {
            '_id': str(self._id) if self._id else None,
            'user_id': str(self.user_id),
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
            'user_id': self.user_id,
            'title': self.title,
            'messages': [msg.to_dict() for msg in self.messages],
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create conversation from dictionary"""
        conv = cls(
            user_id=data['user_id'],
            title=data.get('title', 'New Conversation')
        )
        
        if '_id' in data:
            conv._id = data['_id']
        
        conv.created_at = data.get('created_at', datetime.utcnow())
        conv.updated_at = data.get('updated_at', datetime.utcnow())
        
        # Load messages
        if 'messages' in data:
            conv.messages = [Message.from_dict(msg_data) for msg_data in data['messages']]
        
        return conv