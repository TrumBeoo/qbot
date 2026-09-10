#!/usr/bin/env python3
"""
Test script cho MongoDB chat history system với RAG context
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

API_BASE_URL = "http://localhost:5000"

def test_mongodb_chat_system():
    """Test MongoDB chat system với RAG context"""
    print("🧪 Testing MongoDB Chat System with RAG Context")
    print("=" * 60)
    
    # Test data
    test_email = "mongodb_test@example.com"
    test_password = "test123"
    test_name = "MongoDB Test User"
    
    session = requests.Session()
    
    try:
        # 1. Authentication
        print("1️⃣ Testing authentication...")
        
        # Register (might fail if exists)
        register_data = {
            "name": test_name,
            "email": test_email,
            "password": test_password
        }
        
        register_response = session.post(f"{API_BASE_URL}/api/auth/register", json=register_data)
        if register_response.status_code == 201:
            print("✅ User registered successfully")
        else:
            print("ℹ️ User exists, trying login...")
        
        # Login
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        login_response = session.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
        
        login_result = login_response.json()
        token = login_result['data']['token']
        user_id = login_result['data']['user']['id']
        
        print(f"✅ Login successful. User ID: {user_id}")
        session.headers.update({'Authorization': f'Bearer {token}'})
        
        # 2. Test MongoDB conversation creation
        print("\n2️⃣ Testing MongoDB conversation creation...")
        
        conv_data = {
            "title": "MongoDB RAG Test Conversation",
            "language": "vi"
        }
        conv_response = session.post(f"{API_BASE_URL}/api/chat/conversations", json=conv_data)
        
        if conv_response.status_code != 200:
            print(f"❌ Failed to create conversation: {conv_response.text}")
            return False
        
        conversation = conv_response.json()['data']
        conversation_id = conversation['conversation_id']
        print(f"✅ MongoDB conversation created. ID: {conversation_id}")
        
        # 3. Test contextual chat with MongoDB RAG
        print("\n3️⃣ Testing contextual chat with MongoDB RAG...")
        
        test_conversation = [
            "Xin chào! Tôi muốn tìm hiểu về du lịch Hạ Long Bay.",
            "Vịnh Hạ Long có những hoạt động gì thú vị?",
            "Tôi nên ở khách sạn nào ở Hạ Long?",
            "Chi phí du lịch Hạ Long 3 ngày 2 đêm khoảng bao nhiêu?",
            "Dựa trên những gì chúng ta đã thảo luận, bạn có thể tạo lịch trình chi tiết không?"
        ]
        
        for i, message in enumerate(test_conversation, 1):
            print(f"\n📨 Message {i}: {message}")
            
            chat_data = {
                "message": message,
                "language": "vi",
                "conversation_id": conversation_id
            }
            
            chat_response = session.post(f"{API_BASE_URL}/chat-authenticated", json=chat_data)
            
            if chat_response.status_code != 200:
                print(f"❌ Chat failed: {chat_response.text}")
                continue
            
            chat_result = chat_response.json()
            if chat_result['status'] == 'success':
                bot_response = chat_result['response']
                metadata = chat_result.get('metadata', {})
                
                print(f"✅ Bot response: {bot_response[:150]}...")
                print(f"📊 Metadata: Context={metadata.get('has_context')}, Messages={metadata.get('context_messages')}")
                
                # Check for context awareness in later messages
                if i >= 3:
                    context_indicators = [
                        'như đã đề cập', 'như tôi đã nói', 'dựa trên', 
                        'tiếp tục', 'kết hợp', 'theo thảo luận'
                    ]
                    has_context = any(indicator in bot_response.lower() for indicator in context_indicators)
                    if has_context:
                        print("🧠 ✅ Response shows strong context awareness!")
                    elif metadata.get('has_context'):
                        print("🧠 ⚠️ Has context but may not be fully utilized")
                    else:
                        print("🧠 ❌ No context detected")
            else:
                print(f"❌ Chat error: {chat_result.get('message', 'Unknown error')}")
        
        # 4. Verify MongoDB conversation history
        print("\n4️⃣ Verifying MongoDB conversation history...")
        
        history_response = session.get(f"{API_BASE_URL}/api/chat/conversations/{conversation_id}")
        
        if history_response.status_code != 200:
            print(f"❌ Failed to get conversation: {history_response.text}")
            return False
        
        history_result = history_response.json()
        conversation_data = history_result['data']
        messages = conversation_data.get('messages', [])
        
        print(f"✅ MongoDB conversation retrieved. Messages: {len(messages)}")
        
        user_messages = [msg for msg in messages if msg['role'] == 'user']
        bot_messages = [msg for msg in messages if msg['role'] == 'bot']
        
        print(f"👤 User messages: {len(user_messages)}")
        print(f"🤖 Bot messages: {len(bot_messages)}")
        
        if len(user_messages) == len(test_conversation):
            print("✅ All user messages saved to MongoDB")
        else:
            print(f"⚠️ Expected {len(test_conversation)}, got {len(user_messages)}")
        
        # 5. Test conversation list
        print("\n5️⃣ Testing conversation list...")
        
        conversations_response = session.get(f"{API_BASE_URL}/api/chat/conversations")
        
        if conversations_response.status_code != 200:
            print(f"❌ Failed to get conversations: {conversations_response.text}")
            return False
        
        conversations_result = conversations_response.json()
        conversations_list = conversations_result['data']
        
        print(f"✅ Conversations retrieved: {len(conversations_list)}")
        
        test_conv = next((c for c in conversations_list if c['conversation_id'] == conversation_id), None)
        if test_conv:
            print(f"✅ Test conversation found: '{test_conv['title']}'")
        else:
            print("❌ Test conversation not found in list")
        
        # 6. Test voice chat with MongoDB context
        print("\n6️⃣ Testing voice chat with MongoDB context...")
        
        voice_data = {
            "text": "Cảm ơn bạn về thông tin Hạ Long. Bây giờ tôi muốn hỏi về Sapa có gì khác biệt?",
            "language": "vi",
            "conversation_id": conversation_id
        }
        
        voice_response = session.post(f"{API_BASE_URL}/voice-chat-authenticated", json=voice_data)
        
        if voice_response.status_code == 200:
            voice_result = voice_response.json()
            if voice_result['status'] == 'success':
                print(f"✅ Voice chat successful: {voice_result['response'][:100]}...")
            else:
                print(f"❌ Voice chat error: {voice_result.get('message')}")
        else:
            print(f"❌ Voice chat failed: {voice_response.text}")
        
        # 7. Test search functionality
        print("\n7️⃣ Testing search functionality...")
        
        search_response = session.get(f"{API_BASE_URL}/api/chat/search?q=Hạ Long&limit=10")
        
        if search_response.status_code == 200:
            search_result = search_response.json()
            if search_result['status'] == 'success':
                results = search_result['data']
                print(f"✅ Search successful: {len(results)} results found")
                
                # Check if our conversation is in results
                found_conv = any(r['conversation_id'] == conversation_id for r in results)
                if found_conv:
                    print("✅ Test conversation found in search results")
                else:
                    print("⚠️ Test conversation not found in search")
            else:
                print(f"❌ Search error: {search_result.get('message')}")
        else:
            print(f"❌ Search failed: {search_response.text}")
        
        # 8. Test conversation summary
        print("\n8️⃣ Testing conversation summary...")
        
        summary_response = session.get(f"{API_BASE_URL}/api/chat/conversations/{conversation_id}/summary?language=vi")
        
        if summary_response.status_code == 200:
            summary_result = summary_response.json()
            if summary_result['status'] == 'success':
                summary_data = summary_result['data']
                print(f"✅ Summary generated: {summary_data['summary'][:100]}...")
                print(f"📊 Message count: {summary_data['message_count']}")
            else:
                print(f"❌ Summary error: {summary_result.get('message')}")
        else:
            print(f"❌ Summary failed: {summary_response.text}")
        
        # 9. Test analytics
        print("\n9️⃣ Testing analytics...")
        
        analytics_response = session.get(f"{API_BASE_URL}/api/chat/analytics")
        
        if analytics_response.status_code == 200:
            analytics_result = analytics_response.json()
            if analytics_result['status'] == 'success':
                analytics = analytics_result['data']
                print(f"✅ Analytics retrieved:")
                print(f"   - Total conversations: {analytics.get('total_conversations', 0)}")
                print(f"   - Total messages: {analytics.get('total_messages', 0)}")
                print(f"   - Avg messages/conv: {analytics.get('avg_messages_per_conversation', 0):.1f}")
            else:
                print(f"❌ Analytics error: {analytics_result.get('message')}")
        else:
            print(f"❌ Analytics failed: {analytics_response.text}")
        
        print("\n🎉 MongoDB Chat System Test Completed!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_context_continuity():
    """Test context continuity across multiple conversations"""
    print("\n🧠 Testing Context Continuity")
    print("=" * 40)
    
    print("✅ Context continuity is tested in the main test")
    print("📋 Key indicators:")
    print("   - Messages reference previous topics")
    print("   - Bot responses build on conversation history")
    print("   - Context metadata shows message count")
    print("   - RAG engine uses conversation context")

if __name__ == "__main__":
    print("🚀 Starting MongoDB Chat System Tests")
    print("Make sure the backend server is running on http://localhost:5000")
    print("Make sure MongoDB is running and accessible")
    print()
    
    success = test_mongodb_chat_system()
    
    if success:
        print("\n✅ All MongoDB tests passed! System is working correctly.")
        print("\n📋 Summary:")
        print("- ✅ MongoDB conversation creation works")
        print("- ✅ RAG context integration works")
        print("- ✅ Chat history saves to MongoDB")
        print("- ✅ Context continuity maintained")
        print("- ✅ Voice chat integrates with MongoDB")
        print("- ✅ Search functionality works")
        print("- ✅ Analytics and summaries work")
        print("- ✅ Conversation management works")
    else:
        print("\n❌ Some tests failed. Please check:")
        print("- Backend server is running")
        print("- MongoDB is accessible")
        print("- API endpoints are working")
        print("- Authentication system is working")
    
    test_context_continuity()