import jwt
import hashlib
from datetime import datetime, timedelta
from bson import ObjectId
from db import admin_user_collection
import os

class AdminAuthService:
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this')
    JWT_EXPIRATION_HOURS = 24
    
    @classmethod
    def generate_jwt_token(cls, admin_id):
        """Generate JWT token for admin"""
        payload = {
            'admin_id': str(admin_id),
            'user_type': 'admin',
            'exp': datetime.utcnow() + timedelta(hours=cls.JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, cls.JWT_SECRET, algorithm='HS256')
    
    @classmethod
    def verify_jwt_token(cls, token):
        """Verify JWT token and return admin ID"""
        try:
            data = jwt.decode(token, cls.JWT_SECRET, algorithms=['HS256'])
            if data.get('user_type') != 'admin':
                raise ValueError('Invalid token type')
            return data['admin_id']
        except jwt.ExpiredSignatureError:
            raise ValueError('Token has expired')
        except jwt.InvalidTokenError:
            raise ValueError('Token is invalid')
    
    @classmethod
    def verify_password(cls, password, password_hash, password_salt):
        """Verify password against hash and salt"""
        computed_hash = hashlib.sha256((password + password_salt).encode()).hexdigest()
        return computed_hash == password_hash
    
    @classmethod
    def login_admin(cls, email, password):
        """Login admin with email and password"""
        if not email or not password:
            raise ValueError('Email and password are required')
        
        email = email.strip().lower()
        
        # Find admin in admins collection
        admin = admin_user_collection.find_one({"email": email})
        if not admin:
            raise ValueError('Invalid email or password')
        
        # Check password
        if not cls.verify_password(password, admin['password_hash'], admin['password_salt']):
            raise ValueError('Invalid email or password')
        
        # Check if admin is active
        if not admin.get('is_active', True):
            raise ValueError('Account is deactivated')
        
        # Update last login
        admin_user_collection.update_one(
            {"_id": admin["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Generate token
        token = cls.generate_jwt_token(admin['_id'])
        
        # Prepare admin data for response (remove sensitive fields)
        admin_data = {
            'id': str(admin['_id']),
            'email': admin['email'],
            'name': admin['name'],
            'business_name': admin.get('business_name', ''),
            'role': admin.get('role', 'admin'),
            'is_active': admin.get('is_active', True),
            'profile_picture': admin.get('profile_picture'),
            'created_at': admin.get('created_at'),
            'last_login': admin.get('last_login')
        }
        
        return {
            'user': admin_data,
            'token': token
        }
    
    @classmethod
    def get_admin_by_token(cls, token):
        """Get admin by JWT token"""
        admin_id = cls.verify_jwt_token(token)
        admin = admin_user_collection.find_one({"_id": ObjectId(admin_id)})
        
        if not admin:
            raise ValueError('Admin not found')
        
        if not admin.get('is_active', True):
            raise ValueError('Account is deactivated')
        
        # Prepare admin data (remove sensitive fields)
        admin_data = {
            'id': str(admin['_id']),
            'email': admin['email'],
            'name': admin['name'],
            'business_name': admin.get('business_name', ''),
            'role': admin.get('role', 'admin'),
            'is_active': admin.get('is_active', True),
            'profile_picture': admin.get('profile_picture'),
            'created_at': admin.get('created_at'),
            'last_login': admin.get('last_login')
        }
        
        return admin_data