from services.location_image_service import location_image_service

def add_real_images():
    service = location_image_service
    
    # Thêm ảnh thật cho các địa điểm
    locations_images = [
        {
            'name': 'Vịnh Hạ Long',
            'images': [
                ('/static/images/ha_long_bay.png', 'main', 'Vịnh Hạ Long - Di sản thế giới', 1),
                ('/static/images/halong_city.png', 'gallery', 'Thành phố Hạ Long', 2),
                ('/static/images/van_don.png', 'gallery', 'Vân Đồn gần Hạ Long', 3)
            ]
        }, 
        {
            'name': 'Động Thiên Cung',
            'images': [
                ('https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=400', 'main', 'Động Thiên Cung', 1),
                ('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'gallery', 'Nhũ đá trong động', 2)
            ]
        },
        {
            'name': 'Bãi Cháy',
            'images': [
                ('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', 'main', 'Bãi Cháy', 1),
                ('https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400', 'gallery', 'Hoạt động trên bãi biển', 2)
            ]
        }
    ]
    
    for location_data in locations_images:
        location = service.get_location_by_name(location_data['name'])
        if location:
            for image_url, image_type, caption, order in location_data['images']:
                service.add_location_image(
                    location_id=location['id'],
                    image_url=image_url,
                    image_type=image_type,
                    caption=caption,
                    display_order=order
                )
            print(f"Added {len(location_data['images'])} images")
        else:
            print("Location not found")

if __name__ == "__main__":
    add_real_images()