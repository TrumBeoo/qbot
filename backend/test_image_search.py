#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from services.location_image_service import location_image_service

def test_image_search():
    """Test tìm kiếm ảnh theo địa điểm"""
    
    test_cases = [
        "Tôi muốn xem ảnh của Vịnh Hạ Long",
        "Cho tôi xem ảnh Động Thiên Cung", 
        "Ảnh Bãi Cháy",
        "Hình ảnh Núi Bài Thơ",
        "Chợ Đồng Xuân Hạ Long có gì",
        "Hạ Long có gì đẹp",  # Test case có thể gây nhầm lẫn
    ]
    
    for i, message in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"TEST CASE {i}: {message}")
        print('='*60)
        
        # Extract keywords
        keywords = location_image_service.extract_location_keywords(message)
        print(f"📍 Keywords found: {keywords}")
        
        # Get images
        images = location_image_service.get_images_by_location(keywords, limit=4)
        print(f"🖼️  Found {len(images)} images:")
        
        for j, img in enumerate(images, 1):
            print(f"   {j}. {img['location_name']} - {img['image_type']} (Score: {img.get('relevance_score', 'N/A')})")
            print(f"      URL: {img['url']}")
        
        if not images:
            print("   ❌ No images found")

if __name__ == "__main__":
    test_image_search()