from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import re

class User:
    def __init__(self, data=None):
        if data:
            self._id = data.get('_id')
            self.email = data.get('email')
            self.name = data.get('name')
            self.password = data.get('password')
            self.provider = data.get('provider', 'email')
            self.google_id = data.get('google_id')
            self.facebook_id = data.get('facebook_id')
            self.profile_picture = data.get('profile_picture')
            self.is_active = data.get('is_active', True)
            self.created_at = data.get('created_at', datetime.utcnow())
            self.updated_at = data.get('updated_at', datetime.utcnow())
            self.last_login = data.get('last_login')
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        return True, "Password is valid"
    
    def set_password(self, password):
        """Hash and set password"""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if password matches"""
        return check_password_hash(self.password, password)
    
    def to_dict(self, include_password=False):
        """Convert user to dictionary"""
        data = {
            '_id': str(self._id) if self._id else None,
            'email': self.email,
            'name': self.name,
            'provider': self.provider,
            'profile_picture': self.profile_picture,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_login': self.last_login
        }
        
        if include_password:
            data['password'] = self.password
        
        if self.google_id:
            data['google_id'] = self.google_id
        if self.facebook_id:
            data['facebook_id'] = self.facebook_id
            
        return data
    
    def to_db_dict(self):
        """Convert user to database format"""
        return {
            'email': self.email,
            'name': self.name,
            'password': self.password,
            'provider': self.provider,
            'google_id': self.google_id,
            'facebook_id': self.facebook_id,
            'profile_picture': self.profile_picture,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_login': self.last_login
        }