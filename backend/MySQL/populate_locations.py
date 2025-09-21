import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Tạo kết nối đến MySQL database"""
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", "123456"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        database=os.getenv("MYSQL_DATABASE", "chatbot"),
        charset='utf8mb4'
    )

def populate_quang_ninh_locations():
    """Thêm dữ liệu địa điểm du lịch Quảng Ninh"""
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Dữ liệu địa điểm du lịch Quảng Ninh
        locations_data = [
            {
                'name': 'Vịnh Hạ Long',
                'name_en': 'Ha Long Bay',
                'category': 'attraction',
                'district': 'Hạ Long',
                'description': 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi kỳ thú',
                'description_en': 'UNESCO World Heritage Site with thousands of limestone islands',
                'latitude': 20.9101,
                'longitude': 107.1839,
                'keywords': 'vịnh hạ long, ha long bay, halong bay'
            },
        
            {
                'name': 'Động Thiên Cung',
                'name_en': 'Thien Cung Cave',
                'category': 'cave',
                'district': 'Hạ Long',
                'description': 'Động đá vôi nổi tiếng với nhũ đá đẹp và truyền thuyết cổ tích',
                'description_en': 'Famous limestone cave with beautiful stalactites and fairy tale legends',
                'latitude': 20.9500,
                'longitude': 107.0833,
                'keywords': 'động thiên cung, thien cung cave, thiên cung'
            },
            {
                'name': 'Bãi Cháy',
                'name_en': 'Bai Chay Beach',
                'category': 'beach',
                'district': 'Hạ Long',
                'description': 'Bãi biển nhân tạo đẹp với cát trắng và nhiều hoạt động giải trí',
                'description_en': 'Beautiful artificial beach with white sand and entertainment activities',
                'latitude': 20.9583,
                'longitude': 107.0750,
                'keywords': 'bãi cháy, bai chay beach, bai chay'
            },
            {
                'name': 'Núi Bài Thơ',
                'name_en': 'Bai Tho Mountain',
                'category': 'mountain',
                'district': 'Hạ Long',
                'description': 'Núi cao 106m với tầm nhìn toàn cảnh vịnh Hạ Long',
                'description_en': '106m high mountain with panoramic view of Ha Long Bay',
                'latitude': 20.9667,
                'longitude': 107.0833,
                'keywords': 'núi bài thơ, bai tho mountain, bài thơ'
            },
            {
                'name': 'Chợ Đồng Xuân Hạ Long',
                'name_en': 'Dong Xuan Ha Long Market',
                'category': 'other',
                'district': 'Hạ Long',
                'description': 'Chợ truyền thống với đặc sản hải sản và quà lưu niệm',
                'description_en': 'Traditional market with seafood specialties and souvenirs',
                'latitude': 20.9500,
                'longitude': 107.0667,
                'keywords': 'chợ đồng xuân hạ long, dong xuan ha long market, đồng xuân'
            }
        ]
        
        # Thêm địa điểm vào database
        for location in locations_data:
            insert_location = """
            INSERT INTO locations (name, name_en, category, district, description, description_en, latitude, longitude, keywords)
            VALUES (%(name)s, %(name_en)s, %(category)s, %(district)s, %(description)s, %(description_en)s, %(latitude)s, %(longitude)s, %(keywords)s)
            ON DUPLICATE KEY UPDATE
            name_en = VALUES(name_en),
            description = VALUES(description),
            description_en = VALUES(description_en),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            keywords = VALUES(keywords)
            """
            
            cursor.execute(insert_location, location)
            location_id = cursor.lastrowid
            
            # Thêm ảnh mẫu cho mỗi địa điểm
            sample_images = [
                {
                    'location_id': location_id,
                    'image_url': f'/static/images/{location["name"].lower().replace(" ", "_")}_1.jpg',
                    'image_type': 'main',
                    'caption': f'Ảnh chính của {location["name"]}',
                    'caption_en': f'Main photo of {location["name_en"]}',
                    'display_order': 1
                },
                {
                    'location_id': location_id,
                    'image_url': f'/static/images/{location["name"].lower().replace(" ", "_")}_2.jpg',
                    'image_type': 'gallery',
                    'caption': f'Góc nhìn khác của {location["name"]}',
                    'caption_en': f'Another view of {location["name_en"]}',
                    'display_order': 2
                },
                {
                    'location_id': location_id,
                    'image_url': f'/static/images/{location["name"].lower().replace(" ", "_")}_3.jpg',
                    'image_type': 'gallery',
                    'caption': f'Chi tiết {location["name"]}',
                    'caption_en': f'Details of {location["name_en"]}',
                    'display_order': 3
                }
            ]
            
            for image in sample_images:
                insert_image = """
                INSERT INTO location_images (location_id, image_url, image_type, caption, caption_en, display_order)
                VALUES (%(location_id)s, %(image_url)s, %(image_type)s, %(caption)s, %(caption_en)s, %(display_order)s)
                ON DUPLICATE KEY UPDATE
                caption = VALUES(caption),
                caption_en = VALUES(caption_en)
                """
                
                cursor.execute(insert_image, image)
            
            print(f"Added location with {len(sample_images)} images")
        
        connection.commit()
        print(f"\nSuccessfully populated {len(locations_data)} locations with images!")
        
    except mysql.connector.Error as err:
        print(f"Error populating locations: {err}")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

def get_location_images(location_name):
    """Lấy ảnh theo tên địa điểm"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = """
        SELECT li.image_url, li.caption, li.caption_en, li.image_type, l.name, l.name_en
        FROM location_images li
        JOIN locations l ON li.location_id = l.id
        WHERE l.name LIKE %s OR l.name_en LIKE %s OR l.keywords LIKE %s
        AND li.is_active = TRUE
        ORDER BY li.display_order ASC
        LIMIT 4
        """
        
        search_term = f"%{location_name}%"
        cursor.execute(query, (search_term, search_term, search_term))
        results = cursor.fetchall()
        
        return results
        
    except mysql.connector.Error as err:
        print(f"Error getting location images: {err}")
        return []
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    populate_quang_ninh_locations()