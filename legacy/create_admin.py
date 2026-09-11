#!/usr/bin/env python3
"""
Create admin user in MongoDB admins collection
Run this script when you need to create/recreate admin account
"""

import os
import sys
import hashlib
import secrets
from datetime import datetime
from bson import ObjectId

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from MongoDB.db import admin_user_collection, mongo_db

def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash, salt

def create_admin_user():
    """Create admin user in MongoDB admins collection"""
    print("🚀 Creating admin user in MongoDB admins collection...")
    
    # Admin configuration - Change these as needed
    admin_email = "admin@servicehub.com"
    admin_password = "Admin123!"
    admin_name = "Admin"
    
    try:
        # Check if admin already exists
        existing_admin = admin_user_collection.find_one({"email": admin_email})
        
        if existing_admin:
            print(f"⚠️  Admin user already exists: {admin_email}")
            
            # Ask user if they want to update
            choice = input("Do you want to update the existing admin? (y/n): ").lower()
            if choice != 'y':
                print("❌ Operation cancelled")
                return False
            
            print("Updating existing admin user...")
            
            # Update password
            password_hash, password_salt = hash_password(admin_password)
            
            admin_user_collection.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "password_hash": password_hash,
                        "password_salt": password_salt,
                        "is_active": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            print("✅ Admin user updated successfully!")
            admin_id = existing_admin["_id"]
        else:
            # Create new admin user
            password_hash, password_salt = hash_password(admin_password)
            
            admin_data = {
                "_id": ObjectId(),
                "email": admin_email,
                "password_hash": password_hash,
                "password_salt": password_salt,
                "name": admin_name,
                "business_name": admin_name,
                "business_type": "Quản trị hệ thống",
                "industry": "Technology",
                "phone": "+84 123 456 789",
                "address": "Quảng Ninh, Việt Nam",
                "role": "admin",
                "provider": "email",
                "is_active": True,
                "is_verified": True,
                "profile_picture": None,
                "api_token": secrets.token_urlsafe(32),
                "refresh_token": secrets.token_urlsafe(32),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
            
            # Insert into admins collection
            result = admin_user_collection.insert_one(admin_data)
            admin_id = result.inserted_id
            
            print("✅ Admin user created successfully!")
        
        # Get the admin user data
        admin_user = admin_user_collection.find_one({"_id": admin_id})
        
        print("\n📋 Admin Account Details:")
        print(f"   ID: {admin_id}")
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Name: {admin_name}")
        print(f"   Role: {admin_user['role']}")
        print(f"   Collection: admins")
        
        print("\n🔐 Security Information:")
        print(f"   API Token: {admin_user['api_token'][:20]}...")
        print(f"   Refresh Token: {admin_user['refresh_token'][:20]}...")
        
        print("\n🌐 Login URLs:")
        print(f"   Dashboard: http://localhost:5173/login")
        print(f"   API Test: http://localhost:5000/api/auth/login")
        
        print("\n⚠️  Security Notes:")
        print("   - Change the default password after first login")
        print("   - This account has full admin access")
        print("   - Admin stored in separate 'admins' collection")
        print("   - Delete this script after use for security")
        
        # Test database connection
        print(f"\n🔍 Database Info:")
        print(f"   Database: {mongo_db.name}")
        print(f"   Collections: {mongo_db.list_collection_names()}")
        print(f"   Admin count: {admin_user_collection.count_documents({})}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("ServiceHub Admin Account Creator")
    print("=" * 60)
    
    success = create_admin_user()
    
    if success:
        print("\n🎉 Admin account ready!")
        print("💡 Remember to delete this script after use")
    
    sys.exit(0 if success else 1)