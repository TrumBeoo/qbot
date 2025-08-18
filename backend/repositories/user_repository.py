from bson import ObjectId
from datetime import datetime
from db import users_collection
from models.user import User

class UserRepository:
    @staticmethod
    def create_user(user_data):
        """Create a new user"""
        user = User(user_data)
        user.created_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        
        result = users_collection.insert_one(user.to_db_dict())
        user._id = result.inserted_id
        return user
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        user_data = users_collection.find_one({'email': email.lower()})
        return User(user_data) if user_data else None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        user_data = users_collection.find_one({'_id': user_id})
        return User(user_data) if user_data else None
    
    @staticmethod
    def find_by_google_id(google_id):
        """Find user by Google ID"""
        user_data = users_collection.find_one({'google_id': google_id})
        return User(user_data) if user_data else None
    
    @staticmethod
    def find_by_facebook_id(facebook_id):
        """Find user by Facebook ID"""
        user_data = users_collection.find_one({'facebook_id': facebook_id})
        return User(user_data) if user_data else None
    
    @staticmethod
    def update_user(user_id, update_data):
        """Update user data"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = users_collection.update_one(
            {'_id': user_id},
            {'$set': update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def update_last_login(user_id):
        """Update user's last login timestamp"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        users_collection.update_one(
            {'_id': user_id},
            {'$set': {'last_login': datetime.utcnow()}}
        )
    
    @staticmethod
    def deactivate_user(user_id):
        """Deactivate user account"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        result = users_collection.update_one(
            {'_id': user_id},
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def delete_user(user_id):
        """Delete user (hard delete)"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        result = users_collection.delete_one({'_id': user_id})
        return result.deleted_count > 0