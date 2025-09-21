"""
Script để migrate dữ liệu chat từ MongoDB sang MySQL
Chạy script này để chuyển dữ liệu hiện có từ MongoDB sang MySQL
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def migrate_chat_data():
    """Migrate chat data from MongoDB to MySQL"""
    try:
        # Import MongoDB collections
        from MongoDB.db import mongo_db
        
        # Import MySQL services
        from services.mysql_chat_service import MySQLChatService
        from MySQL.setup_mysql import create_database_and_tables
        
        print("🚀 Starting migration from MongoDB to MySQL...")
        
        # Ensure MySQL database and tables exist
        create_database_and_tables()
        
        # Get MongoDB collections
        chat_collection = mongo_db["chat_history"]
        
        # Get all conversations from MongoDB
        mongo_conversations = list(chat_collection.find({}))
        
        print(f"📊 Found {len(mongo_conversations)} conversations in MongoDB")
        
        migrated_count = 0
        error_count = 0
        
        for mongo_conv in mongo_conversations:
            try:
                # Extract conversation data
                user_id = str(mongo_conv.get('user_id', ''))
                title = mongo_conv.get('title', 'New Conversation')
                created_at = mongo_conv.get('created_at', datetime.utcnow())
                updated_at = mongo_conv.get('updated_at', datetime.utcnow())
                messages = mongo_conv.get('messages', [])
                
                if not user_id:
                    print(f"⚠️ Skipping conversation without user_id: {mongo_conv.get('_id')}")
                    continue
                
                # Create conversation in MySQL
                mysql_conv = MySQLChatService.create_conversation(user_id, title)
                mysql_conv_id = mysql_conv['id']
                
                print(f"✅ Created MySQL conversation: {mysql_conv_id} for user: {user_id}")
                
                # Migrate messages
                for msg in messages:
                    try:
                        text = msg.get('text', '')
                        sender = msg.get('sender', 'user')
                        language = msg.get('language', 'vi')
                        timestamp = msg.get('timestamp', datetime.utcnow())
                        
                        if not text:
                            continue
                        
                        # Add message to MySQL conversation
                        # Note: We add messages individually to maintain the conversation flow
                        if sender == 'user':
                            # Look for the next bot message
                            bot_response = None
                            msg_index = messages.index(msg)
                            if msg_index + 1 < len(messages):
                                next_msg = messages[msg_index + 1]
                                if next_msg.get('sender') == 'bot':
                                    bot_response = next_msg.get('text', '')
                            
                            MySQLChatService.add_message_to_conversation(
                                mysql_conv_id,
                                user_id,
                                text,
                                bot_response,
                                language
                            )
                    
                    except Exception as msg_error:
                        print(f"❌ Error migrating message: {str(msg_error)}")
                        continue
                
                migrated_count += 1
                print(f"✅ Migrated conversation {migrated_count}/{len(mongo_conversations)}")
                
            except Exception as conv_error:
                error_count += 1
                print(f"❌ Error migrating conversation {mongo_conv.get('_id')}: {str(conv_error)}")
                continue
        
        print(f"\n🎉 Migration completed!")
        print(f"✅ Successfully migrated: {migrated_count} conversations")
        print(f"❌ Errors: {error_count} conversations")
        
        if migrated_count > 0:
            print(f"\n📝 Note: Original MongoDB data is preserved.")
            print(f"💡 You can now use MySQL endpoints at /api/mysql-chat/*")
            print(f"🔄 Legacy MongoDB endpoints remain at /api/chat/*")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()

def verify_migration():
    """Verify migration by comparing counts"""
    try:
        from MongoDB.db import mongo_db
        from MySQL.db import execute_query
        
        # Count MongoDB conversations
        mongo_count = mongo_db["chat_history"].count_documents({})
        
        # Count MySQL conversations
        mysql_count = execute_query("SELECT COUNT(*) as count FROM conversations", fetch_one=True)
        mysql_count = mysql_count['count'] if mysql_count else 0
        
        print(f"\n📊 Migration Verification:")
        print(f"MongoDB conversations: {mongo_count}")
        print(f"MySQL conversations: {mysql_count}")
        
        if mysql_count >= mongo_count:
            print("✅ Migration appears successful!")
        else:
            print("⚠️ Some conversations may not have been migrated.")
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")

if __name__ == "__main__":
    print("🔄 MongoDB to MySQL Migration Tool")
    print("=" * 50)
    
    choice = input("Choose an option:\n1. Migrate data\n2. Verify migration\n3. Both\nEnter choice (1-3): ").strip()
    
    if choice in ['1', '3']:
        migrate_chat_data()
    
    if choice in ['2', '3']:
        verify_migration()
    
    print("\n✨ Done!")