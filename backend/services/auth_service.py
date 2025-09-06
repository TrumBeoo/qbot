import jwt
import requests
from datetime import datetime, timedelta
from repositories.user_repository import UserRepository
from models.user import User
import os

class AuthService:
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this')
    JWT_EXPIRATION_HOURS = 24
    
    @classmethod
    def generate_jwt_token(cls, user_id):
        """Generate JWT token for user"""
        payload = {
            'user_id': str(user_id),
            'exp': datetime.utcnow() + timedelta(hours=cls.JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, cls.JWT_SECRET, algorithm='HS256')
    
    @classmethod
    def verify_jwt_token(cls, token):
        """Verify JWT token and return user ID"""
        try:
            data = jwt.decode(token, cls.JWT_SECRET, algorithms=['HS256'])
            return data['user_id']
        except jwt.ExpiredSignatureError:
            raise ValueError('Token has expired')
        except jwt.InvalidTokenError:
            raise ValueError('Token is invalid')
    
    @classmethod
    def register_user(cls, name, email, password, business_info=None):
        """Register a new user"""
        # Validate input
        if not name or not name.strip():
            raise ValueError('Name is required')
        if not email or not email.strip():
            raise ValueError('Email is required')
        if not password:
            raise ValueError('Password is required')
        
        email = email.strip().lower()
        name = name.strip()
        
        if not User.validate_email(email):
            raise ValueError('Invalid email format')
        
        is_valid, message = User.validate_password(password)
        if not is_valid:
            raise ValueError(message)
        
        # Check if user exists
        existing_user = UserRepository.find_by_email(email)
        if existing_user:
            raise ValueError('User with this email already exists')
        
        # Create user
        user_data = {
            'email': email,
            'name': name,
            'provider': 'email',
            'is_active': True,
            'business_info': business_info or {
                'business_name': name,
                'business_type': 'Du lịch',
                'industry': 'Tourism',
                'phone': '',
                'address': ''
            }
        }
        
        user = User(user_data)
        user.set_password(password)
        
        # Save to database
        created_user = UserRepository.create_user(user.to_db_dict())
        
        # Generate token
        token = cls.generate_jwt_token(created_user._id)
        
        return {
            'user': created_user.to_dict(),
            'token': token
        }
    
    @classmethod
    def login_user(cls, email, password):
        """Login user with email and password"""
        if not email or not email.strip():
            raise ValueError('Email is required')
        if not password:
            raise ValueError('Password is required')
        
        email = email.strip().lower()
        
        # Find user
        user = UserRepository.find_by_email(email)
        if not user:
            raise ValueError('Invalid email or password')
        
        # Check if user registered with social login
        if user.provider != 'email':
            raise ValueError(f'This account was created using {user.provider.title()} login. Please use {user.provider.title()} to sign in.')
        
        # Check password
        if not user.check_password(password):
            raise ValueError('Invalid email or password')
        
        # Check if user is active
        if not user.is_active:
            raise ValueError('Account is deactivated')
        
        # Update last login
        UserRepository.update_last_login(user._id)
        
        # Generate token
        token = cls.generate_jwt_token(user._id)
        
        return {
            'user': user.to_dict(),
            'token': token
        }
    
    @classmethod
    def google_login(cls, google_token):
        """Login with Google OAuth"""
        try:
            # Verify Google ID token
            google_client_id = os.getenv('GOOGLE_CLIENT_ID')
            if not google_client_id:
                raise ValueError('Google authentication not configured')
            
            # Verify ID token with Google
            verify_response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={google_token}'
            )
            
            if verify_response.status_code != 200:
                raise ValueError('Invalid Google token')
            
            user_info = verify_response.json()
            
            # Verify audience (client ID)
            if user_info.get('aud') != google_client_id:
                raise ValueError('Invalid token audience')
            
            email = user_info.get('email', '').lower()
            name = user_info.get('name', '')
            google_id = user_info.get('sub')
            profile_picture = user_info.get('picture')
            
            if not email or not google_id:
                raise ValueError('Invalid Google user data')
            
            # Check if user exists
            user = UserRepository.find_by_email(email)
            
            if user:
                # Update existing user
                update_data = {
                    'google_id': google_id,
                    'profile_picture': profile_picture,
                    'last_login': datetime.utcnow()
                }
                UserRepository.update_user(user._id, update_data)
                
                # Refresh user data
                user = UserRepository.find_by_id(user._id)
            else:
                # Create new user
                user_data = {
                    'email': email,
                    'name': name,
                    'google_id': google_id,
                    'provider': 'google',
                    'profile_picture': profile_picture,
                    'is_active': True,
                    'last_login': datetime.utcnow(),
                    'business_info': {
                        'business_name': name,
                        'business_type': 'Du lịch',
                        'industry': 'Tourism',
                        'phone': '',
                        'address': ''
                    }
                }
                
                user = UserRepository.create_user(user_data)
            
            # Generate token
            token = cls.generate_jwt_token(user._id)
            
            return {
                'user': user.to_dict(),
                'token': token
            }
            
        except Exception as e:
            raise ValueError(f'Google login failed: {str(e)}')
    
    @classmethod
    def facebook_login(cls, facebook_token):
        """Login with Facebook OAuth"""
        try:
            # Verify Facebook token
            facebook_app_id = os.getenv('FACEBOOK_APP_ID')
            facebook_app_secret = os.getenv('FACEBOOK_APP_SECRET')
            
            if not facebook_app_id or not facebook_app_secret:
                raise ValueError('Facebook authentication not configured')
            
            # Verify token with Facebook
            verify_url = f'https://graph.facebook.com/debug_token?input_token={facebook_token}&access_token={facebook_app_id}|{facebook_app_secret}'
            response = requests.get(verify_url)
            
            if response.status_code != 200:
                raise ValueError('Invalid Facebook token')
            
            token_data = response.json()
            if not token_data.get('data', {}).get('is_valid'):
                raise ValueError('Invalid Facebook token')
            
            # Get user info from Facebook
            user_info_response = requests.get(
                f'https://graph.facebook.com/me?fields=id,name,email,picture&access_token={facebook_token}'
            )
            
            if user_info_response.status_code != 200:
                raise ValueError('Failed to get user info from Facebook')
            
            user_info = user_info_response.json()
            
            email = user_info.get('email', '').lower()
            name = user_info.get('name', '')
            facebook_id = user_info.get('id')
            profile_picture = user_info.get('picture', {}).get('data', {}).get('url')
            
            if not email or not facebook_id:
                raise ValueError('Invalid Facebook user data')
            
            # Check if user exists
            user = UserRepository.find_by_email(email)
            
            if user:
                # Update existing user
                update_data = {
                    'facebook_id': facebook_id,
                    'profile_picture': profile_picture,
                    'last_login': datetime.utcnow()
                }
                UserRepository.update_user(user._id, update_data)
                
                # Refresh user data
                user = UserRepository.find_by_id(user._id)
            else:
                # Create new user
                user_data = {
                    'email': email,
                    'name': name,
                    'facebook_id': facebook_id,
                    'provider': 'facebook',
                    'profile_picture': profile_picture,
                    'is_active': True,
                    'last_login': datetime.utcnow(),
                    'business_info': {
                        'business_name': name,
                        'business_type': 'Du lịch',
                        'industry': 'Tourism',
                        'phone': '',
                        'address': ''
                    }
                }
                
                user = UserRepository.create_user(user_data)
            
            # Generate token
            token = cls.generate_jwt_token(user._id)
            
            return {
                'user': user.to_dict(),
                'token': token
            }
            
        except Exception as e:
            raise ValueError(f'Facebook login failed: {str(e)}')
    
    @classmethod
    def get_user_by_token(cls, token):
        """Get user by JWT token"""
        user_id = cls.verify_jwt_token(token)
        user = UserRepository.find_by_id(user_id)
        
        if not user:
            raise ValueError('User not found')
        
        if not user.is_active:
            raise ValueError('Account is deactivated')
        
        return user
    
    @classmethod
    def update_user_profile(cls, user_id, profile_data):
        """Update user profile"""
        allowed_fields = ['name', 'profile_picture']
        update_data = {}
        
        for field in allowed_fields:
            if field in profile_data:
                if field == 'name' and profile_data[field]:
                    update_data[field] = profile_data[field].strip()
                else:
                    update_data[field] = profile_data[field]
        
        if not update_data:
            raise ValueError('No valid data to update')
        
        success = UserRepository.update_user(user_id, update_data)
        if not success:
            raise ValueError('Failed to update profile')
        
        # Return updated user
        return UserRepository.find_by_id(user_id)