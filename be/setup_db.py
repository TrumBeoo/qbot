#!/usr/bin/env python3
"""
Database setup script for Chatbot Application
Creates necessary indexes and collections for optimal performance
"""

from MongoDB.db import mongo_db, users_collection
from datetime import datetime

def create_indexes():
    """Create database indexes for better performance"""
    print("Creating database indexes...")
    
    try:
        # Users collection indexes
        users_collection.create_index('email', unique=True)
        users_collection.create_index('google_id', sparse=True)
        users_collection.create_index('facebook_id', sparse=True)
        users_collection.create_index('provider')
        users_collection.create_index('is_active')
        print("✓ Users collection indexes created")
        
        # Chat collection moved to MySQL - no longer needed
        print("✓ Chat collection moved to MySQL")
        
    except Exception as e:
        print(f"Error creating indexes: {e}")

def create_collections():
    """Ensure collections exist"""
    print("Ensuring collections exist...")
    
    try:
        # List existing collections
        existing_collections = mongo_db.list_collection_names()
        
        if 'users' not in existing_collections:
            mongo_db.create_collection('users')
            print("✓ Users collection created")
        else:
            print("✓ Users collection already exists")
            
        # Chat history moved to MySQL - no longer needed in MongoDB
        print("✓ Chat history moved to MySQL")
            
    except Exception as e:
        print(f"Error creating collections: {e}")

def test_connection():
    """Test database connection"""
    print("Testing database connection...")
    
    try:
        # Test connection by getting server info
        server_info = mongo_db.client.server_info()
        print(f"✓ Connected to MongoDB {server_info['version']}")
        
        # Test collections access
        users_count = users_collection.count_documents({})
        
        print(f"✓ Users collection: {users_count} documents")
        print("✓ Chat history moved to MySQL")
        
        return True
        
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def setup_database():
    """Main setup function"""
    print("=" * 50)
    print("Chatbot Database Setup")
    print("=" * 50)
    
    # Test connection first
    if not test_connection():
        print("Database setup failed - connection error")
        return False
    
    # Create collections
    create_collections()
    
    # Create indexes
    create_indexes()
    
    print("=" * 50)
    print("Database setup completed successfully!")
    print("=" * 50)
    
    return True

if __name__ == "__main__":
    setup_database()