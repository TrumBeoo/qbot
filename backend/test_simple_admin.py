#!/usr/bin/env python3
"""
Simple test for MongoDB endpoints with existing admin
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_admin_login():
    """Test login with existing admin"""
    try:
        login_data = {
            "email": "admin@servicehub.com",
            "password": "Admin123!"
        }
        
        print("Testing admin login...")
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('token'):
                print("Admin login successful!")
                return data.get('token')
            else:
                print(f"No token in response: {data}")
        else:
            print(f"Login failed: {response.text}")
        
        return None
        
    except Exception as e:
        print(f"Login test failed: {e}")
        return None

def test_mongodb_endpoint(token):
    """Test MongoDB sync endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\nTesting MongoDB sync status...")
        response = requests.get(f"{BASE_URL}/api/dashboard/mongodb/sync-status", headers=headers)
        
        print(f"MongoDB sync status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("MongoDB endpoint working!")
            print(f"Active files: {data.get('data', {}).get('counts', {}).get('active', 0)}")
            return True
        else:
            print(f"MongoDB endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"MongoDB endpoint test failed: {e}")
        return False

def main():
    print("Testing MongoDB endpoints...")
    print("=" * 40)
    
    token = test_admin_login()
    if not token:
        print("Cannot proceed without valid token")
        return
    
    mongodb_ok = test_mongodb_endpoint(token)
    
    print("\n" + "=" * 40)
    print("RESULTS:")
    print(f"Admin login: {'OK' if token else 'FAIL'}")
    print(f"MongoDB sync: {'OK' if mongodb_ok else 'FAIL'}")
    
    if token and mongodb_ok:
        print("\nAll tests passed! MongoDB sync should work in Dashboard.")
    else:
        print("\nSome tests failed.")

if __name__ == "__main__":
    main()