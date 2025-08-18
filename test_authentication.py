#!/usr/bin/env python3
"""
Comprehensive Authentication System Test
Tests all authentication endpoints and functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_URL = f"{BASE_URL}/api/auth"

class AuthenticationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123"
        }
        self.token = None
        self.user_id = None
        
    def print_test_header(self, test_name):
        print(f"\n{'='*60}")
        print(f"🧪 {test_name}")
        print(f"{'='*60}")
        
    def print_result(self, success, message, details=None):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {message}")
        if details:
            print(f"   Details: {details}")
            
    def test_health_check(self):
        """Test if server is running"""
        self.print_test_header("Health Check")
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                self.print_result(True, "Server is running")
                return True
            else:
                self.print_result(False, f"Server returned {response.status_code}")
                return False
        except Exception as e:
            self.print_result(False, f"Cannot connect to server: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        self.print_test_header("User Registration")
        
        try:
            # Test successful registration
            response = self.session.post(
                f"{AUTH_URL}/register",
                json=self.test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    self.user_id = data['user']['_id']
                    self.print_result(True, "User registration successful")
                    self.print_result(True, f"Token received: {self.token[:20]}...")
                    return True
                else:
                    self.print_result(False, "Registration response missing token or user")
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error')
                self.print_result(False, f"Registration failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Registration error: {str(e)}")
            return False
    
    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        self.print_test_header("Duplicate Registration Test")
        
        try:
            response = self.session.post(
                f"{AUTH_URL}/register",
                json=self.test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                error_msg = response.json().get('error', '')
                if 'already exists' in error_msg.lower():
                    self.print_result(True, "Duplicate registration properly rejected")
                    return True
                else:
                    self.print_result(False, f"Unexpected error message: {error_msg}")
                    return False
            else:
                self.print_result(False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Duplicate registration test error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        self.print_test_header("User Login")
        
        try:
            login_data = {
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
            
            response = self.session.post(
                f"{AUTH_URL}/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    self.print_result(True, "User login successful")
                    self.print_result(True, f"New token: {self.token[:20]}...")
                    return True
                else:
                    self.print_result(False, "Login response missing token or user")
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error')
                self.print_result(False, f"Login failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Login error: {str(e)}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        self.print_test_header("Invalid Login Test")
        
        try:
            invalid_data = {
                "email": self.test_user["email"],
                "password": "wrongpassword"
            }
            
            response = self.session.post(
                f"{AUTH_URL}/login",
                json=invalid_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.print_result(True, "Invalid login properly rejected")
                return True
            else:
                self.print_result(False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Invalid login test error: {str(e)}")
            return False
    
    def test_token_verification(self):
        """Test token verification"""
        self.print_test_header("Token Verification")
        
        if not self.token:
            self.print_result(False, "No token available for testing")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{AUTH_URL}/verify-token",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('valid') and 'user' in data:
                    self.print_result(True, "Token verification successful")
                    return True
                else:
                    self.print_result(False, "Token verification response invalid")
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error')
                self.print_result(False, f"Token verification failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Token verification error: {str(e)}")
            return False
    
    def test_protected_route(self):
        """Test accessing protected route"""
        self.print_test_header("Protected Route Access")
        
        if not self.token:
            self.print_result(False, "No token available for testing")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{AUTH_URL}/profile",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    self.print_result(True, "Protected route access successful")
                    return True
                else:
                    self.print_result(False, "Protected route response invalid")
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error')
                self.print_result(False, f"Protected route access failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Protected route test error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test accessing protected route without token"""
        self.print_test_header("Unauthorized Access Test")
        
        try:
            response = self.session.get(f"{AUTH_URL}/profile")
            
            if response.status_code == 401:
                self.print_result(True, "Unauthorized access properly rejected")
                return True
            else:
                self.print_result(False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Unauthorized access test error: {str(e)}")
            return False
    
    def test_profile_update(self):
        """Test profile update"""
        self.print_test_header("Profile Update")
        
        if not self.token:
            self.print_result(False, "No token available for testing")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            update_data = {
                "name": "Updated Test User"
            }
            
            response = self.session.put(
                f"{AUTH_URL}/profile",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('user', {}).get('name') == "Updated Test User":
                    self.print_result(True, "Profile update successful")
                    return True
                else:
                    self.print_result(False, "Profile not updated correctly")
                    return False
            else:
                error_msg = response.json().get('error', 'Unknown error')
                self.print_result(False, f"Profile update failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Profile update error: {str(e)}")
            return False
    
    def test_input_validation(self):
        """Test input validation"""
        self.print_test_header("Input Validation Tests")
        
        test_cases = [
            {
                "name": "Empty email",
                "data": {"name": "Test", "email": "", "password": "password123"},
                "expected": 400
            },
            {
                "name": "Invalid email format",
                "data": {"name": "Test", "email": "invalid-email", "password": "password123"},
                "expected": 400
            },
            {
                "name": "Short password",
                "data": {"name": "Test", "email": "test2@example.com", "password": "123"},
                "expected": 400
            },
            {
                "name": "Missing name",
                "data": {"email": "test3@example.com", "password": "password123"},
                "expected": 400
            }
        ]
        
        success_count = 0
        for test_case in test_cases:
            try:
                response = self.session.post(
                    f"{AUTH_URL}/register",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == test_case["expected"]:
                    self.print_result(True, f"{test_case['name']} validation works")
                    success_count += 1
                else:
                    self.print_result(False, f"{test_case['name']} - Expected {test_case['expected']}, got {response.status_code}")
                    
            except Exception as e:
                self.print_result(False, f"{test_case['name']} error: {str(e)}")
        
        return success_count == len(test_cases)
    
    def test_authenticated_chat(self):
        """Test authenticated chat endpoint"""
        self.print_test_header("Authenticated Chat Test")
        
        if not self.token:
            self.print_result(False, "No token available for testing")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            chat_data = {
                "message": "Xin chào, tôi muốn biết về du lịch Quảng Ninh",
                "language": "vi"
            }
            
            response = self.session.post(
                f"{BASE_URL}/chat-authenticated",
                json=chat_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'response' in data:
                    self.print_result(True, "Authenticated chat works")
                    self.print_result(True, f"Response: {data['response'][:100]}...")
                    return True
                else:
                    self.print_result(False, "Invalid chat response format")
                    return False
            else:
                error_msg = response.json().get('message', 'Unknown error')
                self.print_result(False, f"Authenticated chat failed: {error_msg}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Authenticated chat error: {str(e)}")
            return False
    
    def cleanup_test_user(self):
        """Clean up test user (if cleanup endpoint exists)"""
        self.print_test_header("Cleanup")
        # Note: This would require a cleanup endpoint in the API
        # For now, just print a message
        self.print_result(True, "Test completed - manual cleanup may be needed")
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print(f"\n🚀 Starting Authentication System Tests")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Target: {BASE_URL}")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("Duplicate Registration", self.test_duplicate_registration),
            ("User Login", self.test_user_login),
            ("Invalid Login", self.test_invalid_login),
            ("Token Verification", self.test_token_verification),
            ("Protected Route", self.test_protected_route),
            ("Unauthorized Access", self.test_unauthorized_access),
            ("Profile Update", self.test_profile_update),
            ("Input Validation", self.test_input_validation),
            ("Authenticated Chat", self.test_authenticated_chat)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ {test_name} crashed: {str(e)}")
                failed += 1
            
            time.sleep(0.5)  # Small delay between tests
        
        # Final results
        print(f"\n{'='*60}")
        print(f"🏁 TEST RESULTS SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print(f"🎉 All tests passed! Authentication system is working correctly.")
        else:
            print(f"⚠️  Some tests failed. Please check the issues above.")
        
        self.cleanup_test_user()
        
        return failed == 0

def main():
    """Main test runner"""
    tester = AuthenticationTester()
    success = tester.run_all_tests()
    
    if success:
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()