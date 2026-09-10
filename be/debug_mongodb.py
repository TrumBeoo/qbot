#!/usr/bin/env python3
"""
Debug script để kiểm tra MongoDB data structure
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def debug_mongodb():
    """Debug MongoDB collections"""
    try:
        from MongoDB.db import chat_collection
        
        print("🔍 MongoDB Debug - Chat Collection")
        print("=" * 50)
        
        # Count documents
        total_docs = chat_collection.count_documents({})
        print(f"📊 Total conversations: {total_docs}")
        
        if total_docs == 0:
            print("⚠️ No conversations found in MongoDB")
            return
        
        # Get sample conversations
        print("\n📋 Sample conversations:")
        conversations = list(chat_collection.find({}).limit(3))
        
        for i, conv in enumerate(conversations, 1):
            print(f"\n--- Conversation {i} ---")
            print(f"ID: {conv.get('_id')}")
            print(f"User ID: {conv.get('user_id')}")
            print(f"Title: {conv.get('title')}")
            print(f"Messages count: {len(conv.get('messages', []))}")
            
            # Show first few messages
            messages = conv.get('messages', [])
            if messages:
                print("Sample messages:")
                for j, msg in enumerate(messages[:3]):
                    print(f"  {j+1}. Role: {msg.get('role')}, Content: {msg.get('content', '')[:50]}...")
            
            print(f"Created: {conv.get('metadata', {}).get('created_at')}")
            print(f"Updated: {conv.get('metadata', {}).get('updated_at')}")
        
        # Test serialization
        print("\n🔧 Testing serialization...")
        from services.mongodb_chat_service import MongoDBChatService
        
        if conversations:
            test_conv = conversations[0]
            serialized = MongoDBChatService._serialize_conversation(test_conv.copy())
            
            print("Serialized conversation keys:", list(serialized.keys()))
            if 'messages' in serialized and serialized['messages']:
                print("Sample serialized message keys:", list(serialized['messages'][0].keys()))
        
        print("\n✅ MongoDB debug completed!")
        
    except Exception as e:
        print(f"❌ MongoDB debug failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_mongodb_service():
    """Test MongoDB service methods"""
    try:
        print("\n🧪 Testing MongoDB Service")
        print("=" * 30)
        
        from services.mongodb_chat_service import MongoDBChatService
        
        # Test get_user_conversations
        print("Testing get_user_conversations...")
        result = MongoDBChatService.get_user_conversations("test_user", limit=5)
        
        if result["success"]:
            print(f"✅ Found {len(result['data'])} conversations")
            if result['data']:
                sample_conv = result['data'][0]
                print(f"Sample conversation keys: {list(sample_conv.keys())}")
        else:
            print(f"❌ Error: {result['error']}")
        
        # Test get_conversation if we have any
        if result["success"] and result['data']:
            conv_id = result['data'][0].get('conversation_id')
            if conv_id:
                print(f"\nTesting get_conversation with ID: {conv_id}")
                conv_result = MongoDBChatService.get_conversation(conv_id, "test_user")
                
                if conv_result["success"]:
                    conv_data = conv_result['data']
                    print(f"✅ Conversation loaded with {len(conv_data.get('messages', []))} messages")
                    if conv_data.get('messages'):
                        sample_msg = conv_data['messages'][0]
                        print(f"Sample message keys: {list(sample_msg.keys())}")
                else:
                    print(f"❌ Error loading conversation: {conv_result['error']}")
        
    except Exception as e:
        print(f"❌ Service test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_mongodb()
    test_mongodb_service()