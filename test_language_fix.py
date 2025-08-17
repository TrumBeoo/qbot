#!/usr/bin/env python3
"""
Test script to verify language detection and response fix
"""
import requests
import json

# Test API endpoint
API_URL = "http://localhost:5000"

def test_chat_language(message, expected_lang):
    """Test chat endpoint with language detection"""
    try:
        response = requests.post(f"{API_URL}/chat", 
                               json={"message": message},
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            data = response.json()
            detected_lang = data.get('language', 'unknown')
            bot_response = data.get('response', '')
            
            print(f"Input: {message}")
            print(f"Expected Language: {expected_lang}")
            print(f"Detected Language: {detected_lang}")
            print(f"Bot Response: {bot_response}")
            print(f"Language Match: {'✓' if detected_lang == expected_lang else '✗'}")
            print("-" * 50)
            
            return detected_lang == expected_lang
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def main():
    print("Testing Language Detection and Response Fix")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        ("Hello, can you tell me about Ha Long Bay?", "en"),
        ("What are the best tourist attractions in Quang Ninh?", "en"),
        ("How can I get to Mong Cai from Ha Long?", "en"),
        ("Xin chào, bạn có thể giới thiệu về vịnh Hạ Long không?", "vi"),
        ("Những địa điểm du lịch nổi tiếng ở Quảng Ninh là gì?", "vi"),
        ("Làm sao để đi từ Hạ Long đến Móng Cái?", "vi"),
    ]
    
    results = []
    for message, expected_lang in test_cases:
        result = test_chat_language(message, expected_lang)
        results.append(result)
    
    # Summary
    passed = sum(results)
    total = len(results)
    print(f"\nTest Results: {passed}/{total} passed")
    
    if passed == total:
        print("✓ All language detection tests passed!")
    else:
        print("✗ Some tests failed. Check the output above.")

if __name__ == "__main__":
    main()