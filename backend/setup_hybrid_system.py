#!/usr/bin/env python3
"""
Setup script for Hybrid Database System
"""

import asyncio
import sys
from datetime import datetime

def setup_mongodb():
    """Setup MongoDB collections and indexes"""
    print("🔧 Setting up MongoDB...")
    
    try:
        from MongoDB.db import db, chat_collection, data_collection
        
        # Create indexes for better performance
        print("  Creating indexes...")
        
        # Chat history indexes
        chat_collection.create_index([("user_id", 1), ("metadata.updated_at", -1)])
        chat_collection.create_index([("session_state.active", 1)])
        chat_collection.create_index([("messages.content", "text")])
        chat_collection.create_index([("user_id", 1), ("title", 1)])
        
        # Data collection indexes
        data_collection.create_index([("filename", 1)], unique=True)
        data_collection.create_index([("status", 1)])
        data_collection.create_index([("sync_timestamp", -1)])
        
        print("✅ MongoDB setup completed")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB setup failed: {e}")
        return False

def setup_mysql():
    """Setup MySQL tables"""
    print("🔧 Setting up MySQL...")
    
    try:
        from MySQL.setup_mysql import create_database_and_tables
        create_database_and_tables()
        print("✅ MySQL setup completed")
        return True
        
    except Exception as e:
        print(f"❌ MySQL setup failed: {e}")
        return False

def test_connections():
    """Test database connections"""
    print("🔍 Testing database connections...")
    
    mongodb_ok = False
    mysql_ok = False
    
    # Test MongoDB
    try:
        from MongoDB.db import db
        result = db.command('ping')
        print("✅ MongoDB connection successful")
        mongodb_ok = True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
    
    # Test MySQL
    try:
        from MySQL.db import get_mysql_connection
        conn = get_mysql_connection()
        conn.close()
        print("✅ MySQL connection successful")
        mysql_ok = True
    except Exception as e:
        print(f"❌ MySQL connection failed: {e}")
    
    return mongodb_ok, mysql_ok

def sync_initial_data():
    """Sync initial data to MongoDB"""
    print("📁 Syncing initial data...")
    
    try:
        from services.mongodb_data_service import MongoDBDataService
        
        # Sync all data files
        result = MongoDBDataService.sync_all_files()
        
        if 'error' not in result:
            print(f"✅ Data sync completed: {result['successful']} files synced")
            return True
        else:
            print(f"⚠️ Data sync warning: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Data sync failed: {e}")
        return False

async def test_hybrid_functionality():
    """Test basic hybrid functionality"""
    print("🧪 Testing hybrid functionality...")
    
    try:
        from services.hybrid_chat_service import hybrid_chat_service
        
        # Test user
        test_user_id = "setup_test_user"
        
        # Create conversation
        conv_result = await hybrid_chat_service.create_conversation(
            test_user_id, 
            "Setup Test Conversation",
            {"language": "vi", "source": "setup_script"}
        )
        
        if not conv_result["success"]:
            print(f"❌ Failed to create test conversation: {conv_result['error']}")
            return False
        
        conversation_id = conv_result["conversation_id"]
        print(f"✅ Test conversation created: {conversation_id}")
        
        # Send test message
        msg_result = await hybrid_chat_service.send_message(
            conversation_id, test_user_id,
            "Xin chào, đây là test message",
            {"language": "vi"}
        )
        
        if not msg_result["success"]:
            print(f"❌ Failed to send test message: {msg_result['error']}")
            return False
        
        print("✅ Test message sent and response received")
        
        # Clean up
        delete_result = await hybrid_chat_service.delete_conversation(conversation_id, test_user_id)
        
        if delete_result["success"]:
            print("✅ Test conversation cleaned up")
        else:
            print(f"⚠️ Cleanup warning: {delete_result['error']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Hybrid functionality test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_sample_data():
    """Create sample data for testing"""
    print("📝 Creating sample data...")
    
    try:
        # Create sample data file if not exists
        import os
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        sample_file = os.path.join(data_dir, 'sample_data.txt')
        
        if not os.path.exists(sample_file):
            sample_content = """
Quảng Ninh - Vùng đất du lịch hấp dẫn

Quảng Ninh là một tỉnh ven biển phía Bắc Việt Nam, nổi tiếng với vịnh Hạ Long - một trong những kỳ quan thiên nhiên thế giới.

Các địa điểm du lịch nổi tiếng:
- Vịnh Hạ Long: Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi
- Đảo Cát Bà: Vườn quốc gia với hệ sinh thái đa dạng
- Vịnh Bái Tử Long: Vẻ đẹp hoang sơ, ít du khách
- Đảo Quan Lạn: Bãi biển đẹp, không khí trong lành
- Cửa Ông: Cảng biển quan trọng, có nhiều hải sản tươi ngon

Ẩm thực đặc sản:
- Chả mực Hạ Long
- Ngán Cửa Ông  
- Bánh đa cua Hải Phòng
- Hải sản tươi sống

Thời gian tốt nhất để du lịch: Tháng 4-10 hàng năm.
            """.strip()
            
            with open(sample_file, 'w', encoding='utf-8') as f:
                f.write(sample_content)
            
            print(f"✅ Sample data file created: {sample_file}")
        else:
            print("✅ Sample data file already exists")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create sample data: {e}")
        return False

def print_system_info():
    """Print system information"""
    print("\n" + "="*60)
    print("🚀 HYBRID DATABASE SYSTEM SETUP")
    print("="*60)
    print(f"Setup time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python version: {sys.version}")
    
    # Database info
    try:
        from config.hybrid_config import config
        print(f"MongoDB Database: {config.MONGODB_DATABASE}")
        print(f"MySQL Database: {config.MYSQL_DATABASE}")
    except:
        print("Configuration not loaded")
    
    print("="*60)

async def main():
    """Main setup function"""
    print_system_info()
    
    # Setup steps
    steps = [
        ("Create sample data", create_sample_data),
        ("Test database connections", test_connections),
        ("Setup MongoDB", setup_mongodb),
        ("Setup MySQL", setup_mysql),
        ("Sync initial data", sync_initial_data),
        ("Test hybrid functionality", test_hybrid_functionality)
    ]
    
    results = []
    
    for step_name, step_func in steps:
        print(f"\n📋 Step: {step_name}")
        print("-" * 40)
        
        try:
            if asyncio.iscoroutinefunction(step_func):
                result = await step_func()
            else:
                result = step_func()
            
            results.append((step_name, result))
            
            if result:
                print(f"✅ {step_name} completed successfully")
            else:
                print(f"❌ {step_name} failed")
                
        except Exception as e:
            print(f"❌ {step_name} failed with exception: {e}")
            results.append((step_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 SETUP SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for step_name, result in results:
        status = "✅ SUCCESS" if result else "❌ FAILED"
        print(f"{step_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} steps completed successfully")
    
    if passed == total:
        print("\n🎉 SETUP COMPLETED SUCCESSFULLY!")
        print("\nYour hybrid database system is ready to use.")
        print("\nNext steps:")
        print("1. Start the Flask application:")
        print("   python app.py")
        print("\n2. Test the API endpoints:")
        print("   POST /api/mongodb/conversations")
        print("   POST /api/mongodb/conversations/{id}/messages")
        print("\n3. Check the documentation:")
        print("   See HYBRID_DATABASE_SYSTEM.md for detailed usage")
        
    else:
        print(f"\n⚠️ SETUP PARTIALLY COMPLETED ({passed}/{total})")
        print("\nSome steps failed, but the system may still be usable.")
        print("Check the error messages above and fix any issues.")
        
        if passed >= total * 0.7:  # 70% success rate
            print("\nThe system should still work for basic functionality.")
    
    return passed == total

if __name__ == "__main__":
    print("🔧 Starting Hybrid Database System Setup...")
    
    try:
        success = asyncio.run(main())
        exit_code = 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrupted by user")
        exit_code = 130
        
    except Exception as e:
        print(f"\n\n❌ Setup failed with unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit_code = 1
    
    print(f"\nSetup finished with exit code: {exit_code}")
    sys.exit(exit_code)