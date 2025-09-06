#!/usr/bin/env python3
import requests
import json

# Test login endpoint
def test_login():
    url = "http://localhost:5000/api/auth/login"
    
    # Test data - using the user we created earlier
    test_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
        else:
            print("❌ Login failed!")
            
    except Exception as e:
        print(f"Error: {e}")

# Test with empty data
def test_empty_login():
    url = "http://localhost:5000/api/auth/login"
    
    # Test data with empty values
    test_data = {
        "email": "",
        "password": ""
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"\nEmpty data test - Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✅ Empty data validation working!")
        else:
            print("❌ Empty data validation failed!")
            
    except Exception as e:
        print(f"Error: {e}")

# Test with wrong credentials
def test_wrong_login():
    url = "http://localhost:5000/api/auth/login"
    
    # Test data with wrong password
    test_data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=test_data, headers=headers)
        print(f"\nWrong credentials test - Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✅ Wrong credentials validation working!")
        else:
            print("❌ Wrong credentials validation failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing login endpoint...")
    test_empty_login()
    test_wrong_login()
    test_login()