from datetime import datetime
from MySQL.db import execute_query, execute_many
from models.mysql_models import MySQLConversation, MySQLMessage, MySQLChatHistory
import uuid

class MySQLChatRepository:
    @staticmethod
    def create_conversation(user_id, title="New Conversation"):
        """Create a new conversation"""
        conversation = MySQLConversation(user_id, title)
        
        query = """
        INSERT INTO conversations (id, user_id, title, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        execute_query(query, (
            conversation.id,
            conversation.user_id,
            conversation.title,
            conversation.created_at,
            conversation.updated_at
        ))
        
        return conversation
    
    @staticmethod
    def find_conversation_by_id(conversation_id, user_id=None):
        """Find conversation by ID"""
        query = "SELECT * FROM conversations WHERE id = %s"
        params = [conversation_id]
        
        if user_id:
            query += " AND user_id = %s"
            params.append(user_id)
        
        conv_data = execute_query(query, params, fetch_one=True)
        
        if not conv_data:
            return None
        
        # Load messages
        messages_query = """
        SELECT * FROM messages 
        WHERE conversation_id = %s 
        ORDER BY timestamp ASC
        """
        messages_data = execute_query(messages_query, [conversation_id], fetch=True)
        
        return MySQLConversation.from_dict(conv_data, messages_data)
    
    @staticmethod
    def find_conversations_by_user(user_id, limit=50, skip=0):
        """Find all conversations for a user"""
        query = """
        SELECT c.*, COUNT(m.id) as message_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.user_id = %s
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT %s OFFSET %s
        """
        
        conversations_data = execute_query(query, [user_id, limit, skip], fetch=True)
        
        conversations = []
        for conv_data in conversations_data:
            conv = MySQLConversation.from_dict(conv_data)
            conversations.append(conv)
        
        return conversations
    
    @staticmethod
    def update_conversation(conversation_id, user_id, update_data):
        """Update conversation"""
        update_data['updated_at'] = datetime.utcnow()
        
        # Build dynamic update query
        set_clauses = []
        params = []
        
        for key, value in update_data.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)
        
        params.extend([conversation_id, user_id])
        
        query = f"""
        UPDATE conversations 
        SET {', '.join(set_clauses)}
        WHERE id = %s AND user_id = %s
        """
        
        result = execute_query(query, params)
        return result > 0
    
    @staticmethod
    def add_messages_to_conversation(conversation_id, user_id, messages):
        """Add messages to conversation"""
        # Verify conversation exists and belongs to user
        conv_check = execute_query(
            "SELECT id FROM conversations WHERE id = %s AND user_id = %s",
            [conversation_id, user_id],
            fetch_one=True
        )
        
        if not conv_check:
            return False
        
        # Prepare message data
        message_data = []
        for msg in messages:
            if isinstance(msg, MySQLMessage):
                msg.conversation_id = conversation_id
                message_data.append((
                    msg.id,
                    msg.conversation_id,
                    msg.text,
                    msg.sender,
                    msg.language,
                    msg.timestamp
                ))
            else:
                # Handle dict format
                msg_id = msg.get('id', str(uuid.uuid4()))
                message_data.append((
                    msg_id,
                    conversation_id,
                    msg['text'],
                    msg['sender'],
                    msg.get('language', 'vi'),
                    msg.get('timestamp', datetime.utcnow())
                ))
        
        # Insert messages
        insert_query = """
        INSERT INTO messages (id, conversation_id, text, sender, language, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        execute_many(insert_query, message_data)
        
        # Update conversation timestamp
        execute_query(
            "UPDATE conversations SET updated_at = %s WHERE id = %s",
            [datetime.utcnow(), conversation_id]
        )
        
        return True
    
    @staticmethod
    def delete_conversation(conversation_id, user_id):
        """Delete conversation and all its messages"""
        # Messages will be deleted automatically due to CASCADE
        query = "DELETE FROM conversations WHERE id = %s AND user_id = %s"
        result = execute_query(query, [conversation_id, user_id])
        return result > 0
    
    @staticmethod
    def delete_message(conversation_id, user_id, message_id):
        """Delete a specific message from conversation"""
        # Verify conversation belongs to user
        conv_check = execute_query(
            "SELECT id FROM conversations WHERE id = %s AND user_id = %s",
            [conversation_id, user_id],
            fetch_one=True
        )
        
        if not conv_check:
            return False
        
        # Delete message
        query = "DELETE FROM messages WHERE id = %s AND conversation_id = %s"
        result = execute_query(query, [message_id, conversation_id])
        
        if result > 0:
            # Update conversation timestamp
            execute_query(
                "UPDATE conversations SET updated_at = %s WHERE id = %s",
                [datetime.utcnow(), conversation_id]
            )
        
        return result > 0
    
    @staticmethod
    def search_conversations(user_id, query, limit=20):
        """Search conversations and messages"""
        search_query = """
        SELECT DISTINCT c.*, COUNT(m.id) as message_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.user_id = %s AND (
            c.title LIKE %s OR 
            EXISTS (
                SELECT 1 FROM messages m2 
                WHERE m2.conversation_id = c.id AND m2.text LIKE %s
            )
        )
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT %s
        """
        
        search_term = f"%{query}%"
        conversations_data = execute_query(
            search_query, 
            [user_id, search_term, search_term, limit], 
            fetch=True
        )
        
        conversations = []
        for conv_data in conversations_data:
            # Load messages for each conversation
            messages_query = """
            SELECT * FROM messages 
            WHERE conversation_id = %s 
            ORDER BY timestamp ASC
            """
            messages_data = execute_query(messages_query, [conv_data['id']], fetch=True)
            
            conv = MySQLConversation.from_dict(conv_data, messages_data)
            conversations.append(conv)
        
        return conversations
    
    @staticmethod
    def get_conversation_count(user_id):
        """Get total conversation count for user"""
        query = "SELECT COUNT(*) as count FROM conversations WHERE user_id = %s"
        result = execute_query(query, [user_id], fetch_one=True)
        return result['count'] if result else 0
    
    @staticmethod
    def export_user_conversations(user_id):
        """Export all conversations for a user"""
        query = """
        SELECT * FROM conversations 
        WHERE user_id = %s 
        ORDER BY created_at ASC
        """
        
        conversations_data = execute_query(query, [user_id], fetch=True)
        
        conversations = []
        for conv_data in conversations_data:
            # Load messages for each conversation
            messages_query = """
            SELECT * FROM messages 
            WHERE conversation_id = %s 
            ORDER BY timestamp ASC
            """
            messages_data = execute_query(messages_query, [conv_data['id']], fetch=True)
            
            conv = MySQLConversation.from_dict(conv_data, messages_data)
            conversations.append(conv)
        
        return conversations
    
    # Legacy support methods for chat_history table
    @staticmethod
    def save_chat_history(user_id, user_message, bot_response, language='vi', conversation_id=None):
        """Save to chat_history table (legacy support)"""
        chat_history = MySQLChatHistory(user_id, user_message, bot_response, language, conversation_id)
        
        query = """
        INSERT INTO chat_history (id, user_id, conversation_id, user_message, bot_response, language, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_query(query, (
            chat_history.id,
            chat_history.user_id,
            chat_history.conversation_id,
            chat_history.user_message,
            chat_history.bot_response,
            chat_history.language,
            chat_history.created_at
        ))
        
        return chat_history
    
    @staticmethod
    def get_chat_history(user_id, limit=50, skip=0):
        """Get chat history for user (legacy support)"""
        query = """
        SELECT * FROM chat_history 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT %s OFFSET %s
        """
        
        history_data = execute_query(query, [user_id, limit, skip], fetch=True)
        return [MySQLChatHistory.from_dict(data) for data in history_data]