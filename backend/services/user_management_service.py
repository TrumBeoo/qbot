from datetime import datetime
from repositories.user_repository import UserRepository
from models.user import User
import bcrypt

class UserManagementService:
    @staticmethod
    def get_all_users():
        """Get all users with basic info"""
        try:
            users = UserRepository.get_all_users()
            return {
                'users': [
                    {
                        'id': str(user['_id']),
                        'name': user.get('name') or user.get('businessInfo', {}).get('businessName') or user.get('email', 'Unknown'),
                        'email': user.get('email'),
                        'role': user.get('role', 'user'),
                        'status': 'active' if user.get('is_active', True) else 'inactive',
                        'createdAt': user.get('created_at', datetime.now()).strftime('%Y-%m-%d') if user.get('created_at') else datetime.now().strftime('%Y-%m-%d'),
                        'lastLogin': user.get('last_login').strftime('%Y-%m-%d %H:%M') if user.get('last_login') else None,
                        'permissions': user.get('permissions', {}),
                        'provider': user.get('provider', 'email')
                    }
                    for user in users
                ]
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def create_user(user_data):
        """Create new user"""
        try:
            # Validate required fields
            if not user_data.get('email') or not user_data.get('name'):
                return {'error': 'Email and name are required'}
            
            # Check if user already exists
            existing_user = UserRepository.find_by_email(user_data['email'])
            if existing_user:
                return {'error': 'User with this email already exists'}
            
            # Create user object
            user = User(
                email=user_data['email'],
                name=user_data['name'],
                role=user_data.get('role', 'user'),
                status=user_data.get('status', 'active')
            )
            
            # Generate temporary password if not provided
            if user_data.get('password'):
                user.password_hash = bcrypt.hashpw(
                    user_data['password'].encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
            else:
                # Generate temporary password
                import secrets
                temp_password = secrets.token_urlsafe(12)
                user.password_hash = bcrypt.hashpw(
                    temp_password.encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
            
            # Save user
            user_id = UserRepository.create_user(user)
            
            return {
                'success': True,
                'user_id': str(user_id),
                'message': 'User created successfully'
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def update_user(user_id, user_data):
        """Update existing user"""
        try:
            # Get existing user
            existing_user = UserRepository.find_by_id(user_id)
            if not existing_user:
                return {'error': 'User not found'}
            
            # Update fields
            update_data = {}
            if 'name' in user_data:
                update_data['name'] = user_data['name']
            if 'email' in user_data:
                # Check if email is already taken by another user
                email_user = UserRepository.find_by_email(user_data['email'])
                if email_user and str(email_user['_id']) != user_id:
                    return {'error': 'Email already taken by another user'}
                update_data['email'] = user_data['email']
            if 'role' in user_data:
                update_data['role'] = user_data['role']
            if 'status' in user_data:
                update_data['status'] = user_data['status']
            
            update_data['updated_at'] = datetime.now()
            
            # Update user
            UserRepository.update_user(user_id, update_data)
            
            return {
                'success': True,
                'message': 'User updated successfully'
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def delete_user(user_id):
        """Delete user"""
        try:
            # Check if user exists
            existing_user = UserRepository.find_by_id(user_id)
            if not existing_user:
                return {'error': 'User not found'}
            
            # Don't allow deleting admin users
            if existing_user.get('role') == 'admin':
                return {'error': 'Cannot delete admin users'}
            
            # Delete user
            UserRepository.delete_user(user_id)
            
            return {
                'success': True,
                'message': 'User deleted successfully'
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def update_user_permissions(user_id, permissions):
        """Update user permissions"""
        try:
            # Check if user exists
            existing_user = UserRepository.find_by_id(user_id)
            if not existing_user:
                return {'error': 'User not found'}
            
            # Update permissions
            update_data = {
                'permissions': permissions,
                'updated_at': datetime.now()
            }
            
            UserRepository.update_user(user_id, update_data)
            
            return {
                'success': True,
                'message': 'User permissions updated successfully'
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def get_user_permissions(user_id):
        """Get user permissions"""
        try:
            user = UserRepository.find_by_id(user_id)
            if not user:
                return {'error': 'User not found'}
            
            return {
                'success': True,
                'permissions': user.get('permissions', {}),
                'role': user.get('role', 'user')
            }
        except Exception as e:
            return {'error': str(e)}