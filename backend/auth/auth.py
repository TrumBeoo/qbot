from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from functools import wraps
from services.auth_service import AuthService
from services.admin_auth_service import AdminAuthService
from repositories.user_repository import UserRepository

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    """Decorator to require JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Try admin token first
            try:
                admin = AdminAuthService.get_admin_by_token(token)
                current_user_id = admin['id']
                return f(current_user_id, *args, **kwargs)
            except ValueError:
                # If admin token fails, try regular user token
                pass
            
            # Try regular user token
            user = AuthService.get_user_by_token(token)
            current_user_id = str(user._id)
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            return jsonify({'error': 'Token validation failed'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated



@auth_bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        business_info = data.get('businessInfo')
        
        result = AuthService.register_user(name, email, password, business_info)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': result['user'],
            'token': result['token']
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    """Login user or admin"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Try admin login first
        try:
            result = AdminAuthService.login_admin(email, password)
            return jsonify({
                'message': 'Admin login successful',
                'user': result['user'],
                'token': result['token']
            }), 200
        except ValueError:
            # If admin login fails, try regular user login
            pass
        
        # Try regular user login
        result = AuthService.login_user(email, password)
        
        return jsonify({
            'message': 'Login successful',
            'user': result['user'],
            'token': result['token']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/google-login', methods=['POST'])
@cross_origin()
def google_login():
    """Google OAuth login"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        google_token = data.get('token')
        if not google_token:
            return jsonify({'error': 'Google token is required'}), 400
        
        result = AuthService.google_login(google_token)
        
        return jsonify({
            'message': 'Google login successful',
            'user': result['user'],
            'token': result['token']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Google login error: {str(e)}")
        return jsonify({'error': 'Google login failed'}), 500

@auth_bp.route('/facebook-login', methods=['POST'])
@cross_origin()
def facebook_login():
    """Facebook OAuth login"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        facebook_token = data.get('token')
        if not facebook_token:
            return jsonify({'error': 'Facebook token is required'}), 400
        
        result = AuthService.facebook_login(facebook_token)
        
        return jsonify({
            'message': 'Facebook login successful',
            'user': result['user'],
            'token': result['token']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Facebook login error: {str(e)}")
        return jsonify({'error': 'Facebook login failed'}), 500

@auth_bp.route('/verify-token', methods=['POST'])
@cross_origin()
def verify_token():
    """Verify JWT token and return user/admin data"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Try admin token first
        try:
            admin = AdminAuthService.get_admin_by_token(token)
            return jsonify({
                'valid': True,
                'user': admin,
                'user_type': 'admin'
            }), 200
        except ValueError:
            # If admin token fails, try regular user token
            pass
        
        # Try regular user token
        user = AuthService.get_user_by_token(token)
        
        return jsonify({
            'valid': True,
            'user': user.to_dict(),
            'user_type': 'user'
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Token verification failed'}), 401

@auth_bp.route('/logout', methods=['POST'])
@cross_origin()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/profile', methods=['GET'])
@cross_origin()
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    try:
        user = UserRepository.find_by_id(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        print(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@cross_origin()
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_user = AuthService.update_user_profile(current_user_id, data)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': updated_user.to_dict()
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500