#!/usr/bin/env python3
"""
Test admin login with different passwords
"""

from services.auth_service import AuthService

def test_admin_login():
    """Test different passwords for admin"""
    passwords_to_try = ['admin', 'admin123', 'password', '123456', 'admin@gmail.com']
    
    for pwd in passwords_to_try:
        try:
            result = AuthService.login_user('admin@gmail.com', pwd)
            print(f'SUCCESS: Password is "{pwd}"')
            print(f'User: {result["user"]["name"]}')
            return
        except Exception as e:
            print(f'FAILED: "{pwd}" - {str(e)}')
    
    print('No valid password found from common options')

if __name__ == "__main__":
    test_admin_login()