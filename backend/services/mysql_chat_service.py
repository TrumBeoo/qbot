from repositories.mysql_chat_repository import MySQLChatRepository
from models.mysql_models import MySQLConversation, MySQLMessage
from datetime import datetime

class MySQLChatService:
    @classmethod
    def create_conversation(cls, user_id, title="New Conversation"):
        """Create a new conversation for user"""
        if not title.strip():
            title = "New Conversation"
        
        conversation = MySQLChatRepository.create_conversation(user_id, title.strip())
        return conversation.to_dict(include_messages=False)
    
    @classmethod
    def create_conversation_with_message(cls, user_id, user_message, bot_response=None, language='vi'):
        """Create a new conversation and add the first message pair"""
        if not user_message.strip():
            raise ValueError('User message cannot be empty')
        
        # Generate title from first message
        title = cls._generate_conversation_title(user_message)
        
        # Create conversation
        conversation = MySQLChatRepository.create_conversation(user_id, title)
        
        # Add messages
        messages = []
        timestamp = datetime.utcnow()
        
        # User message
        user_msg = MySQLMessage(user_message.strip(), 'user', language, timestamp, conversation.id)
        messages.append(user_msg)
        
        # Bot response (if provided)
        if bot_response and bot_response.strip():
            bot_msg = MySQLMessage(bot_response.strip(), 'bot', language, timestamp, conversation.id)
            messages.append(bot_msg)
        
        # Add messages to conversation
        success = MySQLChatRepository.add_messages_to_conversation(
            conversation.id, 
            user_id, 
            messages
        )
        
        if not success:
            raise ValueError('Failed to add messages to new conversation')
        
        print(f"💾 Created conversation '{title}' with {len(messages)} messages")
        return {
            'conversation': conversation.to_dict(include_messages=False),
            'messages': [msg.to_dict() for msg in messages]
        }
    
    @classmethod
    def _generate_conversation_title(cls, message):
        """Generate a meaningful title for conversation based on first message"""
        if not message or not message.strip():
            return "New Conversation"
        
        # Clean the message
        clean_message = message.strip()
        
        # If message is too short, use it as is
        if len(clean_message) <= 30:
            return clean_message
        
        # Try to extract key topics or locations
        import re
        
        # Look for location names (capitalized words)
        locations = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', clean_message)
        if locations:
            location = locations[0]
            if len(location) <= 25:
                return f"About {location}"
        
        # Look for question words to create descriptive titles
        question_patterns = {
            r'\b(?:where|nơi nào|ở đâu)\b': 'Location Question',
            r'\b(?:how|làm sao|như thế nào)\b': 'How-to Question', 
            r'\b(?:what|gì|cái gì)\b': 'Information Request',
            r'\b(?:when|khi nào|lúc nào)\b': 'Time Question',
            r'\b(?:why|tại sao|vì sao)\b': 'Explanation Request',
            r'\b(?:hotel|khách sạn)\b': 'Hotel Inquiry',
            r'\b(?:restaurant|nhà hàng|ăn)\b': 'Food & Dining',
            r'\b(?:travel|du lịch|trip)\b': 'Travel Planning',
            r'\b(?:price|giá|cost|chi phí)\b': 'Price Inquiry'
        }
        
        for pattern, title_type in question_patterns.items():
            if re.search(pattern, clean_message, re.IGNORECASE):
                return title_type
        
        # Fallback: use first 30 characters with ellipsis
        if len(clean_message) > 30:
            return clean_message[:27] + "..."
        
        return clean_message
    
    @classmethod
    def get_user_conversations(cls, user_id, limit=50, skip=0):
        """Get all conversations for a user"""
        conversations = MySQLChatRepository.find_conversations_by_user(user_id, limit, skip)
        return [conv.to_dict(include_messages=False) for conv in conversations]
    
    @classmethod
    def get_conversation(cls, conversation_id, user_id):
        """Get a specific conversation with messages"""
        conversation = MySQLChatRepository.find_conversation_by_id(conversation_id, user_id)
        if not conversation:
            raise ValueError('Conversation not found')
        
        return conversation.to_dict(include_messages=True)
    
    @classmethod
    def update_conversation_title(cls, conversation_id, user_id, title):
        """Update conversation title"""
        if not title.strip():
            raise ValueError('Title cannot be empty')
        
        success = MySQLChatRepository.update_conversation(
            conversation_id, 
            user_id, 
            {'title': title.strip()}
        )
        
        if not success:
            raise ValueError('Failed to update conversation')
        
        return True
    
    @classmethod
    def add_message_to_conversation(cls, conversation_id, user_id, user_message, bot_response=None, language='vi'):
        """Add message(s) to conversation"""
        if not user_message.strip():
            raise ValueError('User message cannot be empty')
        
        # Verify conversation exists and belongs to user
        existing_conversation = MySQLChatRepository.find_conversation_by_id(conversation_id, user_id)
        if not existing_conversation:
            raise ValueError(f'Conversation {conversation_id} not found or does not belong to user {user_id}')
        
        # Create messages
        messages = []
        timestamp = datetime.utcnow()
        
        # User message
        user_msg = MySQLMessage(user_message.strip(), 'user', language, timestamp, conversation_id)
        messages.append(user_msg)
        
        # Bot response (if provided)
        if bot_response and bot_response.strip():
            bot_msg = MySQLMessage(bot_response.strip(), 'bot', language, timestamp, conversation_id)
            messages.append(bot_msg)
        
        # Add to conversation
        success = MySQLChatRepository.add_messages_to_conversation(
            conversation_id, 
            user_id, 
            messages
        )
        
        if not success:
            raise ValueError('Failed to add message to conversation')
        
        print(f"💾 Successfully added {len(messages)} messages to conversation {conversation_id}")
        return [msg.to_dict() for msg in messages]
    
    @classmethod
    def delete_conversation(cls, conversation_id, user_id):
        """Delete a conversation"""
        success = MySQLChatRepository.delete_conversation(conversation_id, user_id)
        if not success:
            raise ValueError('Conversation not found or failed to delete')
        
        return True
    
    @classmethod
    def delete_message(cls, conversation_id, user_id, message_id):
        """Delete a specific message from conversation"""
        success = MySQLChatRepository.delete_message(conversation_id, user_id, message_id)
        if not success:
            raise ValueError('Message not found or failed to delete')
        
        return True
    
    @classmethod
    def search_conversations(cls, user_id, query, limit=20):
        """Search conversations and messages"""
        if not query.strip():
            raise ValueError('Search query cannot be empty')
        
        conversations = MySQLChatRepository.search_conversations(user_id, query.strip(), limit)
        
        # Format results with matching messages highlighted
        results = []
        for conv in conversations:
            conv_dict = conv.to_dict(include_messages=False)
            
            # Find matching messages
            matching_messages = []
            for message in conv.messages:
                if query.lower() in message.text.lower():
                    msg_dict = message.to_dict()
                    matching_messages.append(msg_dict)
            
            conv_dict['matching_messages'] = matching_messages
            results.append(conv_dict)
        
        return results
    
    @classmethod
    def export_user_conversations(cls, user_id):
        """Export all conversations for a user"""
        conversations = MySQLChatRepository.export_user_conversations(user_id)
        
        export_data = {
            'user_id': str(user_id),
            'export_date': datetime.utcnow().isoformat(),
            'total_conversations': len(conversations),
            'conversations': []
        }
        
        for conv in conversations:
            conv_data = {
                'id': conv.id,
                'title': conv.title,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'message_count': conv.get_message_count(),
                'messages': []
            }
            
            for message in conv.messages:
                msg_data = {
                    'id': message.id,
                    'text': message.text,
                    'sender': message.sender,
                    'timestamp': message.timestamp.isoformat(),
                    'language': message.language
                }
                conv_data['messages'].append(msg_data)
            
            export_data['conversations'].append(conv_data)
        
        return export_data
    
    @classmethod
    def get_conversation_stats(cls, user_id):
        """Get conversation statistics for user"""
        conversations = MySQLChatRepository.find_conversations_by_user(user_id, limit=1000)
        
        total_conversations = len(conversations)
        total_messages = sum(conv.get_message_count() for conv in conversations)
        
        # Calculate average messages per conversation
        avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
        
        return {
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'average_messages_per_conversation': round(avg_messages, 2)
        }
    
