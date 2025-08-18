from bson import ObjectId
from datetime import datetime
from db import chat_collection
from models.chat import Conversation, Message

class ChatRepository:
    @staticmethod
    def create_conversation(user_id, title="New Conversation"):
        """Create a new conversation"""
        conversation = Conversation(user_id, title)
        
        result = chat_collection.insert_one(conversation.to_db_dict())
        conversation._id = result.inserted_id
        return conversation
    
    @staticmethod
    def find_conversation_by_id(conversation_id, user_id=None):
        """Find conversation by ID"""
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        
        query = {'_id': conversation_id}
        if user_id:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            query['user_id'] = user_id
        
        conv_data = chat_collection.find_one(query)
        return Conversation.from_dict(conv_data) if conv_data else None
    
    @staticmethod
    def find_conversations_by_user(user_id, limit=50, skip=0):
        """Find all conversations for a user"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        conversations = list(chat_collection.find(
            {'user_id': user_id},
            {'messages': 0}  # Exclude messages for list view
        ).sort('updated_at', -1).limit(limit).skip(skip))
        
        return [Conversation.from_dict(conv) for conv in conversations]
    
    @staticmethod
    def update_conversation(conversation_id, user_id, update_data):
        """Update conversation"""
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = chat_collection.update_one(
            {'_id': conversation_id, 'user_id': user_id},
            {'$set': update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def add_messages_to_conversation(conversation_id, user_id, messages):
        """Add messages to conversation"""
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        # Convert Message objects to dict format
        message_dicts = []
        for msg in messages:
            if isinstance(msg, Message):
                message_dicts.append(msg.to_dict())
            else:
                message_dicts.append(msg)
        
        result = chat_collection.update_one(
            {'_id': conversation_id, 'user_id': user_id},
            {
                '$push': {'messages': {'$each': message_dicts}},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def delete_conversation(conversation_id, user_id):
        """Delete conversation"""
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        result = chat_collection.delete_one({
            '_id': conversation_id,
            'user_id': user_id
        })
        
        return result.deleted_count > 0
    
    @staticmethod
    def delete_message(conversation_id, user_id, message_id):
        """Delete a specific message from conversation"""
        if isinstance(conversation_id, str):
            conversation_id = ObjectId(conversation_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        if isinstance(message_id, str):
            message_id = ObjectId(message_id)
        
        result = chat_collection.update_one(
            {'_id': conversation_id, 'user_id': user_id},
            {
                '$pull': {'messages': {'_id': message_id}},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def search_conversations(user_id, query, limit=20):
        """Search conversations and messages"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        search_results = list(chat_collection.find({
            'user_id': user_id,
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'messages.text': {'$regex': query, '$options': 'i'}}
            ]
        }).sort('updated_at', -1).limit(limit))
        
        return [Conversation.from_dict(conv) for conv in search_results]
    
    @staticmethod
    def get_conversation_count(user_id):
        """Get total conversation count for user"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        return chat_collection.count_documents({'user_id': user_id})
    
    @staticmethod
    def export_user_conversations(user_id):
        """Export all conversations for a user"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        conversations = list(chat_collection.find(
            {'user_id': user_id}
        ).sort('created_at', 1))
        
        return [Conversation.from_dict(conv) for conv in conversations]