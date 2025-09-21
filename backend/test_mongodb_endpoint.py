#!/usr/bin/env python3
"""
Test MongoDB endpoints directly
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            return True
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_mongodb_sync_without_auth():
    """Test MongoDB sync endpoint without authentication"""
    try:
        response = requests.get(f"{BASE_URL}/api/dashboard/mongodb/sync-status")
        print(f"MongoDB sync status (no auth): {response.status_code}")
        if response.status_code != 200:
            print(f"Error response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"MongoDB sync test failed: {e}")
        return False

def create_test_admin():
    """Create test admin user"""
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        
        from MongoDB.db import admin_user_collection
        import bcrypt
        from datetime import datetime
        
        # Check if admin exists
        existing_admin = admin_user_collection.find_one({"email": "test@admin.com"})
        if existing_admin:
            print("Test admin already exists")
            return True
        
        # Create admin
        admin_data = {
            "email": "test@admin.com",
            "password": bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "name": "Test Admin",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        
        admin_user_collection.insert_one(admin_data)
        print("Test admin created successfully")
        return True
        
    except Exception as e:
        print(f"Failed to create test admin: {e}")
        return False

def login_and_test():
    """Login and test with authentication"""
    try:
        # Login
        login_data = {
            "email": "test@admin.com",
            "password": "admin123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return False
        
        data = response.json()
        if data.get('status') != 'success':
            print(f"Login unsuccessful: {data}")
            return False
        
        token = data.get('token')
        if not token:
            print("No token received")
            return False
        
        print("Login successful, testing MongoDB endpoint...")
        
        # Test MongoDB endpoint with auth
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/mongodb/sync-status", headers=headers)
        
        print(f"MongoDB sync status (with auth): {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Login and test failed: {e}")
        return False

def main():
    print("Testing MongoDB endpoints...")
    print("=" * 40)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    health_ok = test_health()
    
    # Test 2: MongoDB without auth (should fail)
    print("\n2. Testing MongoDB endpoint without auth...")
    no_auth_ok = test_mongodb_sync_without_auth()
    
    # Test 3: Create admin and test with auth
    print("\n3. Creating test admin...")
    admin_created = create_test_admin()
    
    if admin_created:
        print("\n4. Testing with authentication...")
        auth_ok = login_and_test()
    else:
        auth_ok = False
    
    print("\n" + "=" * 40)
    print("RESULTS:")
    print(f"Health check: {'OK' if health_ok else 'FAIL'}")
    print(f"No auth (should fail): {'FAIL' if not no_auth_ok else 'UNEXPECTED OK'}")
    print(f"Admin created: {'OK' if admin_created else 'FAIL'}")
    print(f"With auth: {'OK' if auth_ok else 'FAIL'}")

if __name__ == "__main__":
    main()