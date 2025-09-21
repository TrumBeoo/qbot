#!/usr/bin/env python3
"""
Test MongoDB endpoints with existing admin
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_admin_login():
    """Test login with existing admin"""
    try:
        # Use the admin credentials from create_admin.py
        login_data = {
            "email": "admin@servicehub.com",
            "password": "Admin123!"
        }
        
        print("Testing admin login...")
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                token = data.get('token')
                print("✅ Admin login successful!")
                return token
            else:
                print(f"Login unsuccessful: {data}")
        else:
            print(f"Login failed: {response.text}")
        
        return None
        
    except Exception as e:
        print(f"Login test failed: {e}")
        return None

def test_mongodb_endpoint(token):
    """Test MongoDB sync endpoint with authentication"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\nTesting MongoDB sync status endpoint...")
        response = requests.get(f"{BASE_URL}/api/dashboard/mongodb/sync-status", headers=headers)
        
        print(f"MongoDB sync status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ MongoDB endpoint working!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ MongoDB endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"MongoDB endpoint test failed: {e}")
        return False

def test_sync_all(token):
    """Test sync all files endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\nTesting sync all files...")
        response = requests.post(f"{BASE_URL}/api/dashboard/mongodb/sync-all", headers=headers)
        
        print(f"Sync all files: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Sync all files working!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Sync all files failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Sync all files test failed: {e}")
        return False

def main():
    print("Testing MongoDB endpoints with existing admin...")
    print("=" * 50)
    
    # Test 1: Login
    token = test_admin_login()
    if not token:
        print("❌ Cannot proceed without valid token")
        return
    
    # Test 2: MongoDB sync status
    sync_status_ok = test_mongodb_endpoint(token)
    
    # Test 3: Sync all files
    sync_all_ok = test_sync_all(token)
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"Admin login: {'✅ OK' if token else '❌ FAIL'}")
    print(f"MongoDB sync status: {'✅ OK' if sync_status_ok else '❌ FAIL'}")
    print(f"Sync all files: {'✅ OK' if sync_all_ok else '❌ FAIL'}")
    
    if all([token, sync_status_ok, sync_all_ok]):
        print("\n🎉 All tests passed! MongoDB sync should work in Dashboard.")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()