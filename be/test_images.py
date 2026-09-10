#!/usr/bin/env python3
"""Test script for image service"""

from services.simple_image_service import simple_image_service

def test_image_service():
    print("🧪 Testing Image Service")
    print("=" * 50)
    
    # Test 1: Response with Vịnh Hạ Long
    test_response_1 = "Vịnh Hạ Long là một trong những di sản thiên nhiên thế giới"
    print(f"\n📝 Test 1: {test_response_1}")
    images_1 = simple_image_service.get_images_for_response(test_response_1)
    print(f"🖼️ Result: {len(images_1)} images")
    for img in images_1:
        print(f"   - {img['url']} ({img['caption']})")
    
    # Test 2: Response with Động Thiên Cung
    test_response_2 = "Động Thiên Cung là một trong những hang động đẹp nhất"
    print(f"\n📝 Test 2: {test_response_2}")
    images_2 = simple_image_service.get_images_for_response(test_response_2)
    print(f"🖼️ Result: {len(images_2)} images")
    for img in images_2:
        print(f"   - {img['url']} ({img['caption']})")
    
    # Test 3: General tourism response
    test_response_3 = "Du lịch Quảng Ninh có nhiều địa điểm tham quan hấp dẫn"
    print(f"\n📝 Test 3: {test_response_3}")
    images_3 = simple_image_service.get_images_for_response(test_response_3)
    print(f"🖼️ Result: {len(images_3)} images")
    for img in images_3:
        print(f"   - {img['url']} ({img['caption']})")
    
    # Test 4: Random images
    print(f"\n📝 Test 4: Random images")
    images_4 = simple_image_service.get_random_images(3)
    print(f"🖼️ Result: {len(images_4)} images")
    for img in images_4:
        print(f"   - {img['url']} ({img['caption']})")

if __name__ == "__main__":
    test_image_service()