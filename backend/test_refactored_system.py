#!/usr/bin/env python3
"""
Test script for the refactored authentication and chat system
"""

import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:5000'

class SystemTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.conversation_id = None
        
    def test_health(self):
        """Test server health"""
        print("🔍 Testing server health...")
        try:
            response = requests.get(f'{BASE_URL}/health')
            if response.status_code == 200:
                print("✅ Server is healthy")
                return True
            else:
                print("❌ Server health check failed")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_registration(self):
        """Test user registration"""
        print("\n🔍 Testing user registration...")
        
        test_user = {
            'name': 'Test User',
            'email': f'test_{datetime.now().timestamp()}@example.com',
            'password': 'testpassword123'
        }
        
        try:
            response = requests.post(
                f'{BASE_URL}/api/auth/register',
                json=test_user,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.token = data['token']
                self.user_id = data['user']['_id']
                print(f"✅ Registration successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Registration failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
    
    def test_token_verification(self):
        """Test JWT token verification"""
        print("\n🔍 Testing token verification...")
        
        if not self.token:
            print("❌ No token available for testing")
            return False
        
        try:
            response = requests.post(
                f'{BASE_URL}/api/auth/verify-token',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Token verification successful - User: {data['user']['name']}")
                return True
            else:
                print(f"❌ Token verification failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Token verification error: {e}")
            return False
    
    def test_conversation_creation(self):
        """Test conversation creation"""
        print("\n🔍 Testing conversation creation...")
        
        if not self.token:
            print("❌ No token available for testing")
            return False
        
        try:
            response = requests.post(
                f'{BASE_URL}/api/chat/conversations',
                json={'title': 'Test Conversation'},
                headers={
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                self.conversation_id = data['conversation_id']
                print(f"✅ Conversation created - ID: {self.conversation_id}")
                return True
            else:
                print(f"❌ Conversation creation failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Conversation creation error: {e}")
            return False
    
    def test_authenticated_chat(self):
        """Test authenticated chat with history saving"""
        print("\n🔍 Testing authenticated chat...")
        
        if not self.token or not self.conversation_id:
            print("❌ Missing token or conversation ID")
            return False
        
        try:
            response = requests.post(
                f'{BASE_URL}/chat-authenticated',
                json={
                    'message': 'Hello, this is a test message',
                    'conversation_id': self.conversation_id,
                    'language': 'en'
                },
                headers={
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Authenticated chat successful - Response: {data['response'][:50]}...")
                return True
            else:
                print(f"❌ Authenticated chat failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Authenticated chat error: {e}")
            return False
    
    def test_conversation_retrieval(self):
        """Test conversation retrieval with messages"""
        print("\n🔍 Testing conversation retrieval...")
        
        if not self.token or not self.conversation_id:
            print("❌ Missing token or conversation ID")
            return False
        
        try:
            response = requests.get(
                f'{BASE_URL}/api/chat/conversations/{self.conversation_id}',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                message_count = len(data['conversation']['messages'])
                print(f"✅ Conversation retrieved - {message_count} messages found")
                return True
            else:
                print(f"❌ Conversation retrieval failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Conversation retrieval error: {e}")
            return False
    
    def test_public_chat(self):
        """Test public chat (no authentication)"""
        print("\n🔍 Testing public chat...")
        
        try:
            response = requests.post(
                f'{BASE_URL}/chat',
                json={
                    'message': 'Hello, this is a public test message',
                    'language': 'en'
                },
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Public chat successful - Response: {data['response'][:50]}...")
                return True
            else:
                print(f"❌ Public chat failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Public chat error: {e}")
            return False
    
    def test_conversation_stats(self):
        """Test conversation statistics"""
        print("\n🔍 Testing conversation statistics...")
        
        if not self.token:
            print("❌ No token available for testing")
            return False
        
        try:
            response = requests.get(
                f'{BASE_URL}/api/chat/stats',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Stats retrieved - Conversations: {data['total_conversations']}, Messages: {data['total_messages']}")
                return True
            else:
                print(f"❌ Stats retrieval failed: {response.json()}")
                return False
                
        except Exception as e:
            print(f"❌ Stats retrieval error: {e}")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.token and self.conversation_id:
            try:
                # Delete test conversation
                requests.delete(
                    f'{BASE_URL}/api/chat/conversations/{self.conversation_id}',
                    headers={'Authorization': f'Bearer {self.token}'}
                )
                print("✅ Test conversation deleted")
            except Exception as e:
                print(f"⚠️ Cleanup warning: {e}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Refactored System Tests")
        print("=" * 50)
        
        tests = [
            self.test_health,
            self.test_registration,
            self.test_token_verification,
            self.test_conversation_creation,
            self.test_authenticated_chat,
            self.test_conversation_retrieval,
            self.test_public_chat,
            self.test_conversation_stats
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("\n" + "=" * 50)
        print(f"🎯 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! System is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the output above for details.")
        
        # Cleanup
        self.cleanup()
        
        return passed == total

if __name__ == "__main__":
    tester = SystemTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)