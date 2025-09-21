import mysql.connector
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import re

load_dotenv()

class LocationImageService:
    """Service để quản lý ảnh theo địa điểm du lịch"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv("MYSQL_HOST", "localhost"),
            'user': os.getenv("MYSQL_USER", "root"),
            'password': os.getenv("MYSQL_PASSWORD", "123456"),
            'port': int(os.getenv("MYSQL_PORT", 3306)),
            'database': os.getenv("MYSQL_DATABASE", "chatbot"),
            'charset': 'utf8mb4'
        }
    
    def get_connection(self):
        """Tạo kết nối database"""
        return mysql.connector.connect(**self.db_config)
    
    def extract_location_keywords(self, message: str) -> List[str]:
        """Trích xuất từ khóa địa điểm từ tin nhắn với độ ưu tiên"""
        message_lower = message.lower()
        
        # Danh sách địa điểm cụ thể với độ ưu tiên cao
        specific_locations = [
            'vịnh hạ long', 'ha long bay', 'halong bay',
            'động thiên cung', 'thien cung cave', 'thiên cung',
            'bãi cháy', 'bai chay beach', 'bai chay',
            'núi bài thơ', 'bai tho mountain', 'bài thơ',
            'chợ đồng xuân hạ long', 'dong xuan ha long market', 'đồng xuân'
        ]
        
        # Tìm kiếm exact match trước
        found_keywords = []
        for location in specific_locations:
            if location in message_lower:
                found_keywords.append(location)
        
        # Nếu không tìm thấy exact match, tìm từ khóa đơn lẻ
        if not found_keywords:
            single_keywords = [
                'hạ long', 'ha long', 'halong',
                'thiên cung', 'thien cung',
                'bãi cháy', 'bai chay',
                'bài thơ', 'bai tho',
                'đồng xuân', 'dong xuan'
            ]
            
            for keyword in single_keywords:
                if keyword in message_lower:
                    found_keywords.append(keyword)
        
        return found_keywords
    
    def get_images_by_location(self, location_keywords: List[str], limit: int = 4) -> List[Dict]:
        """Lấy ảnh theo từ khóa địa điểm với scoring để ưu tiên exact match"""
        if not location_keywords:
            return []
        
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            # Tạo điều kiện tìm kiếm với scoring
            search_conditions = []
            search_params = []
            
            for keyword in location_keywords:
                # Ưu tiên exact match trong tên địa điểm
                search_conditions.append("""
                    (CASE 
                        WHEN LOWER(l.name) = %s THEN 100
                        WHEN LOWER(l.name_en) = %s THEN 95
                        WHEN LOWER(l.name) LIKE %s THEN 80
                        WHEN LOWER(l.name_en) LIKE %s THEN 75
                        WHEN LOWER(l.keywords) LIKE %s THEN 50
                        ELSE 0
                    END) > 0
                """)
                search_params.extend([
                    keyword.lower(),  # exact match name
                    keyword.lower(),  # exact match name_en
                    f"%{keyword}%",   # partial match name
                    f"%{keyword}%",   # partial match name_en
                    f"%{keyword}%"    # partial match keywords
                ])
            
            where_clause = " OR ".join(search_conditions)
            
            # Query với scoring để sắp xếp theo độ liên quan
            query = f"""
            SELECT 
                li.image_url,
                li.image_type,
                l.name as location_name,
                l.name_en as location_name_en,
                l.description,
                l.category,
                (
                    {' + '.join([f'''
                    (CASE 
                        WHEN LOWER(l.name) = %s THEN 100
                        WHEN LOWER(l.name_en) = %s THEN 95
                        WHEN LOWER(l.name) LIKE %s THEN 80
                        WHEN LOWER(l.name_en) LIKE %s THEN 75
                        WHEN LOWER(l.keywords) LIKE %s THEN 50
                        ELSE 0
                    END)
                    ''' for _ in location_keywords])}
                ) as relevance_score
            FROM location_images li
            JOIN locations l ON li.location_id = l.id
            WHERE ({where_clause})
            AND li.is_active = TRUE
            ORDER BY 
                relevance_score DESC,
                CASE li.image_type 
                    WHEN 'main' THEN 1 
                    WHEN 'gallery' THEN 2 
                    ELSE 3 
                END,
                li.display_order ASC
            LIMIT %s
            """
            
            # Thêm params cho scoring trong SELECT
            scoring_params = []
            for keyword in location_keywords:
                scoring_params.extend([
                    keyword.lower(),  # exact match name
                    keyword.lower(),  # exact match name_en
                    f"%{keyword}%",   # partial match name
                    f"%{keyword}%",   # partial match name_en
                    f"%{keyword}%"    # partial match keywords
                ])
            
            all_params = scoring_params + search_params + [limit]
            cursor.execute(query, all_params)
            results = cursor.fetchall()
            
            # Format kết quả cho frontend
            formatted_results = []
            for row in results:
                # Chỉ lấy kết quả có điểm số cao (>= 75 để đảm bảo chính xác)
                if row['relevance_score'] >= 75:
                    # Tạo URL tuyệt đối
                    image_url = row['image_url']
                    if image_url.startswith('/static/'):
                        image_url = f"http://localhost:5000{image_url}"
                    
                    formatted_results.append({
                        'url': image_url,
                        'alt': row['description'] or row['location_name'],
                        'caption': row['location_name'],
                        'location_name': row['location_name'],
                        'category': row['category'],
                        'image_type': row['image_type'],
                        'relevance_score': row['relevance_score']
                    })
            
            return formatted_results
            
        except mysql.connector.Error as err:
            print(f"Error getting location images: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    def get_images_by_category(self, category: str, limit: int = 4) -> List[Dict]:
        """Lấy ảnh theo loại địa điểm"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                li.image_url,
             
                l.name as location_name,
                l.name_en as location_name_en,
                l.description
            FROM location_images li
            JOIN locations l ON li.location_id = l.id
            WHERE l.category = %s
            AND li.is_active = TRUE
            ORDER BY li.display_order ASC
            LIMIT %s
            """
            
            cursor.execute(query, (category, limit))
            results = cursor.fetchall()
            
            formatted_results = []
            for row in results:
                image_url = row['image_url']
                if image_url.startswith('/static/'):
                    image_url = f"http://localhost:5000{image_url}"
                
                formatted_results.append({
                    'url': image_url,
                    'alt': row['description'] or row['location_name'],
                    'caption': row['location_name'],
                    'location_name': row['location_name']
                })
            
            return formatted_results
            
        except mysql.connector.Error as err:
            print(f"Error getting category images: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    def add_location_image(self, location_id: int, image_url: str, 
                          image_type: str = 'gallery', caption: str = None,
                          caption_en: str = None, display_order: int = 0) -> bool:
        """Thêm ảnh cho địa điểm"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            query = """
            INSERT INTO location_images 
            (location_id, image_url, image_type, caption, caption_en, display_order)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (location_id, image_url, image_type, caption, caption_en, display_order))
            connection.commit()
            
            print(f"Added image for location {location_id}")
            return True
            
        except mysql.connector.Error as err:
            print(f"Error adding location image: {err}")
            connection.rollback()
            return False
        finally:
            cursor.close()
            connection.close()
    
    def get_location_by_name(self, name: str) -> Optional[Dict]:
        """Tìm địa điểm theo tên"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = """
            SELECT * FROM locations 
            WHERE name LIKE %s OR name_en LIKE %s OR keywords LIKE %s
            LIMIT 1
            """
            
            search_term = f"%{name}%"
            cursor.execute(query, (search_term, search_term, search_term))
            result = cursor.fetchone()
            
            return result
            
        except mysql.connector.Error as err:
            print(f"Error finding location: {err}")
            return None
        finally:
            cursor.close()
            connection.close()
    
    def get_all_locations(self) -> List[Dict]:
        """Lấy tất cả địa điểm"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = "SELECT id, name, name_en, category FROM locations ORDER BY name"
            cursor.execute(query)
            results = cursor.fetchall()
            return results
            
        except mysql.connector.Error as err:
            print(f"Error getting all locations: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    def delete_location_image(self, image_id: int) -> bool:
        """Xóa ảnh địa điểm"""
        connection = self.get_connection()
        cursor = connection.cursor()
        
        try:
            query = "DELETE FROM location_images WHERE id = %s"
            cursor.execute(query, (image_id,))
            connection.commit()
            
            return cursor.rowcount > 0
            
        except mysql.connector.Error as err:
            print(f"Error deleting location image: {err}")
            connection.rollback()
            return False
        finally:
            cursor.close()
            connection.close()

# Singleton instance
location_image_service = LocationImageService()