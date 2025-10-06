#!/usr/bin/env python3
"""
Test script for Hybrid Database System (MongoDB + MySQL)
"""

import asyncio
import json
from datetime import datetime
from services.hybrid_chat_service import hybrid_chat_service
from services.mongodb_chat_service import MongoDBChatService
from services.mysql_chat_service import MySQLChatService

async def test_mongodb_service():
    """Test MongoDB Chat Service"""
    print("🧪 Testing MongoDB Chat Service...")
    
    # Test data
    user_id = "test_user_123"
    
    try:
        # 1. Create conversation
        print("1. Creating conversation...")
        conv_result = MongoDBChatService.create_conversation(
            user_id, 
            "Test Conversation", 
            {"language": "vi", "tags": ["test"]}
        )
        
        if conv_result["success"]:
            conversation_id = conv_result["conversation_id"]
            print(f"✅ Conversation created: {conversation_id}")
        else:
            print(f"❌ Failed to create conversation: {conv_result['error']}")
            return False
        
        # 2. Add messages
        print("2. Adding messages...")
        
        # User message
        user_msg_result = MongoDBChatService.add_message(
            conversation_id, user_id, "user", 
            "Xin chào, tôi muốn hỏi về du lịch Hạ Long",
            {"language": "vi"}
        )
        
        if user_msg_result["success"]:
            print("✅ User message added")
        else:
            print(f"❌ Failed to add user message: {user_msg_result['error']}")
            return False
        
        # Bot message
        bot_msg_result = MongoDBChatService.add_message(
            conversation_id, user_id, "bot",
            "Chào bạn! Tôi có thể giúp bạn tìm hiểu về du lịch Hạ Long. Bạn muốn biết thông tin gì cụ thể?",
            {"language": "vi", "confidence": 0.9, "response_time": 1.2}
        )
        
        if bot_msg_result["success"]:
            print("✅ Bot message added")
        else:
            print(f"❌ Failed to add bot message: {bot_msg_result['error']}")
            return False
        
        # 3. Get conversation
        print("3. Getting conversation...")
        get_result = MongoDBChatService.get_conversation(conversation_id, user_id)
        
        if get_result["success"]:
            messages = get_result["data"]["messages"]
            print(f"✅ Retrieved conversation with {len(messages)} messages")
        else:
            print(f"❌ Failed to get conversation: {get_result['error']}")
            return False
        
        # 4. Search conversations
        print("4. Searching conversations...")
        search_result = MongoDBChatService.search_conversations(user_id, "Hạ Long")
        
        if search_result["success"]:
            results = search_result["data"]
            print(f"✅ Search found {len(results)} conversations")
        else:
            print(f"❌ Search failed: {search_result['error']}")
            return False
        
        # 5. Get analytics
        print("5. Getting analytics...")
        analytics_result = MongoDBChatService.get_analytics(user_id)
        
        if analytics_result["success"]:
            analytics = analytics_result["analytics"]
            print(f"✅ Analytics: {analytics['total_conversations']} conversations, {analytics['total_messages']} messages")
        else:
            print(f"❌ Analytics failed: {analytics_result['error']}")
            return False
        
        # 6. Clean up
        print("6. Cleaning up...")
        delete_result = MongoDBChatService.delete_conversation(conversation_id, user_id)
        
        if delete_result["success"]:
            print("✅ Conversation deleted")
        else:
            print(f"❌ Failed to delete conversation: {delete_result['error']}")
        
        print("✅ MongoDB Service test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB Service test failed: {e}")
        return False

async def test_hybrid_service():
    """Test Hybrid Chat Service"""
    print("\n🧪 Testing Hybrid Chat Service...")
    
    user_id = "test_user_456"
    
    try:
        # 1. Create conversation
        print("1. Creating conversation via hybrid service...")
        conv_result = await hybrid_chat_service.create_conversation(
            user_id, 
            "Hybrid Test Conversation",
            {"language": "vi", "device_info": "test_device"}
        )
        
        if conv_result["success"]:
            conversation_id = conv_result["conversation_id"]
            print(f"✅ Hybrid conversation created: {conversation_id}")
        else:
            print(f"❌ Failed to create hybrid conversation: {conv_result['error']}")
            return False
        
        # 2. Send message (with RAG)
        print("2. Sending message via hybrid service...")
        msg_result = await hybrid_chat_service.send_message(
            conversation_id, user_id, 
            "Hạ Long có những địa điểm nào đẹp?",
            {"language": "vi"}
        )
        
        if msg_result["success"]:
            user_msg = msg_result["user_message"]
            bot_response = msg_result["bot_response"]
            metadata = msg_result["metadata"]
            print(f"✅ Message sent and response received")
            print(f"   Response time: {metadata['response_time']:.2f}s")
            print(f"   Confidence: {metadata['confidence']:.2f}")
            print(f"   Bot response: {bot_response['content'][:100]}...")
        else:
            print(f"❌ Failed to send message: {msg_result['error']}")
            return False
        
        # 3. Get conversation from both sources
        print("3. Getting conversation from both sources...")
        
        # From MongoDB
        mongo_result = await hybrid_chat_service.get_conversation(
            conversation_id, user_id, "mongodb"
        )
        
        if mongo_result["success"]:
            mongo_messages = len(mongo_result["data"]["messages"])
            print(f"✅ MongoDB: {mongo_messages} messages")
        else:
            print(f"❌ MongoDB get failed: {mongo_result['error']}")
        
        # 4. Get analytics from both sources
        print("4. Getting analytics from both sources...")
        analytics_result = await hybrid_chat_service.get_analytics(user_id, source="both")
        
        if analytics_result["success"]:
            analytics = analytics_result["analytics"]
            if "mongodb" in analytics:
                mongo_stats = analytics["mongodb"]
                print(f"✅ MongoDB Analytics: {mongo_stats['total_conversations']} conversations")
            if "mysql" in analytics:
                mysql_stats = analytics["mysql"]
                print(f"✅ MySQL Analytics: {mysql_stats.get('total_conversations', 'N/A')} conversations")
        else:
            print(f"❌ Analytics failed: {analytics_result['error']}")
        
        # 5. Test sync to MySQL
        print("5. Testing sync to MySQL...")
        sync_result = await hybrid_chat_service.sync_conversation_to_mysql(conversation_id, user_id)
        
        if sync_result["success"]:
            print(f"✅ Sync successful: {sync_result['message']}")
        else:
            print(f"⚠️ Sync warning: {sync_result['error']}")
        
        # 6. Clean up
        print("6. Cleaning up...")
        delete_result = await hybrid_chat_service.delete_conversation(conversation_id, user_id)
        
        if delete_result["success"]:
            print("✅ Hybrid conversation deleted")
        else:
            print(f"❌ Failed to delete hybrid conversation: {delete_result['error']}")
        
        print("✅ Hybrid Service test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Hybrid Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_database_connections():
    """Test database connections"""
    print("\n🧪 Testing Database Connections...")
    
    # Test MongoDB
    try:
        from MongoDB.db import db
        result = db.command('ping')
        print("✅ MongoDB connection successful")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False
    
    # Test MySQL
    try:
        from MySQL.db import get_mysql_connection
        conn = get_mysql_connection()
        conn.close()
        print("✅ MySQL connection successful")
    except Exception as e:
        print(f"❌ MySQL connection failed: {e}")
        return False
    
    return True

async def test_data_sync():
    """Test data synchronization"""
    print("\n🧪 Testing Data Synchronization...")
    
    try:
        from services.mongodb_data_service import MongoDBDataService
        
        # Get sync status
        print("1. Getting sync status...")
        status = MongoDBDataService.get_sync_status()
        print(f"✅ Sync status retrieved: {status['counts']['active']} active files")
        
        # Test sync (if data files exist)
        print("2. Testing file sync...")
        sync_result = MongoDBDataService.sync_all_files()
        
        if 'error' not in sync_result:
            print(f"✅ File sync completed: {sync_result['successful']} successful, {sync_result['failed']} failed")
        else:
            print(f"⚠️ File sync warning: {sync_result['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Data sync test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Hybrid Database System Tests")
    print("=" * 50)
    
    # Test results
    results = []
    
    # 1. Test database connections
    results.append(await test_database_connections())
    
    # 2. Test MongoDB service
    results.append(await test_mongodb_service())
    
    # 3. Test hybrid service
    results.append(await test_hybrid_service())
    
    # 4. Test data sync
    results.append(await test_data_sync())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    
    test_names = [
        "Database Connections",
        "MongoDB Service", 
        "Hybrid Service",
        "Data Synchronization"
    ]
    
    passed = sum(results)
    total = len(results)
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Hybrid system is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    # Run tests
    success = asyncio.run(main())
    
    if success:
        print("\n✅ Hybrid Database System is ready for use!")
        print("\nNext steps:")
        print("1. Start the Flask application: python app.py")
        print("2. Test API endpoints using the documentation")
        print("3. Integrate with frontend applications")
    else:
        print("\n❌ Please fix the issues before using the system.")
    
    exit(0 if success else 1)