import mysql.connector
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()

class SimpleImageService:
    """Image service for chatbot responses - relies on Dashboard-managed images"""
    
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
        """Create database connection"""
        return mysql.connector.connect(**self.db_config)
    
    def extract_location_names(self, text: str) -> List[str]:
        """Extract specific location names from bot response text"""
        text_lower = text.lower()
        
        # Specific location mappings with variations
        location_mappings = {
            'vịnh hạ long': ['vịnh hạ long', 'ha long bay', 'halong bay', 'hạ long', 'ha long', 'halong'],
            'động thiên cung': ['động thiên cung', 'thien cung cave', 'thiên cung', 'thien cung'],
            'động đầu gỗ': ['động đầu gỗ', 'dau go cave', 'đầu gỗ', 'dau go'],
            'động sửng sốt': ['động sửng sốt', 'sung sot cave', 'sửng sốt', 'sung sot'],
            'bãi cháy': ['bãi cháy', 'bai chay beach', 'bai chay'],
            'núi bài thơ': ['núi bài thơ', 'bai tho mountain', 'bài thơ', 'bai tho'],
            'tuần châu': ['tuần châu', 'tuan chau'],
            'yên tử': ['yên tử', 'yen tu'],
            'cẩm phả': ['cẩm phả', 'cam pha'],
            'móng cái': ['móng cái', 'mong cai'],
            'đông triều': ['đông triều', 'dong trieu'],
            'quảng yên': ['quảng yên', 'quang yen']
        }
        
        found_locations = []
        for canonical_name, variations in location_mappings.items():
            for variation in variations:
                if variation in text_lower:
                    found_locations.append(canonical_name)
                    break  # Only add once per canonical location
        
        return found_locations
    
    def get_images_for_response(self, bot_response: str, limit: int = 4) -> List[Dict]:
        """Get images based on specific locations mentioned in bot response"""
        locations = self.extract_location_names(bot_response)
        
        # If specific locations found, get their images
        if locations:
            return self._get_images_by_locations(locations, limit)
        
        # If no specific locations but response seems tourism-related, get general images
        if self._is_tourism_response(bot_response):
            return self.get_random_images(min(limit, 2))  # Fewer random images
        
        return []
    
    def _get_images_by_locations(self, locations: List[str], limit: int = 4) -> List[Dict]:
        """Get images for specific locations"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            # Search for images based on exact location matches
            search_conditions = []
            search_params = []
            
            for location in locations:
                # Create more precise matching for location names
                search_conditions.append("""
                    (LOWER(l.name) = %s OR 
                     LOWER(l.name_en) = %s OR 
                     LOWER(l.name) LIKE %s OR 
                     LOWER(l.name_en) LIKE %s OR
                     LOWER(l.keywords) LIKE %s)
                """)
                search_params.extend([
                    location.lower(),
                    location.lower(),
                    f"%{location.lower()}%",
                    f"%{location.lower()}%",
                    f"%{location.lower()}%"
                ])
            
            where_clause = " OR ".join(search_conditions)
            
            query = f"""
            SELECT 
                li.image_url,
                li.image_type,
                li.caption,
                l.name as location_name,
                l.name_en as location_name_en,
                l.description,
                l.category
            FROM location_images li
            JOIN locations l ON li.location_id = l.id
            WHERE ({where_clause})
            AND li.is_active = TRUE
            ORDER BY 
                CASE li.image_type 
                    WHEN 'main' THEN 1 
                    WHEN 'gallery' THEN 2 
                    ELSE 3 
                END,
                li.display_order ASC
            LIMIT %s
            """
            
            all_params = search_params + [limit]
            cursor.execute(query, all_params)
            results = cursor.fetchall()
            
            # Format results
            formatted_results = []
            for row in results:
                image_url = row['image_url']
                if image_url.startswith('/static/'):
                    image_url = f"http://localhost:5000{image_url}"
                
                display_name = row['location_name_en'] or row['location_name']
                
                formatted_results.append({
                    'url': image_url,
                    'alt': row['caption'] or display_name,
                    'caption': display_name,
                    'location_name': row['location_name'],
                    'category': row['category'],
                    'image_type': row['image_type']
                })
            
            return formatted_results
            
        except mysql.connector.Error as err:
            print(f"Error getting images for locations: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    def _is_tourism_response(self, response: str) -> bool:
        """Check if response is tourism-related but doesn't mention specific locations"""
        response_lower = response.lower()
        
        tourism_indicators = [
            'du lịch', 'travel', 'tourism', 'tham quan', 'visit', 'khám phá', 'explore',
            'địa điểm', 'destination', 'khách sạn', 'hotel', 'nhà hàng', 'restaurant',
            'ẩm thực', 'cuisine', 'food', 'văn hóa', 'culture', 'lịch sử', 'history',
            'giao thông', 'transportation', 'thời tiết', 'weather', 'chi phí', 'cost',
            'giá cả', 'price', 'lịch trình', 'itinerary', 'hoạt động', 'activity',
            'quảng ninh', 'quang ninh'
        ]
        
        return any(indicator in response_lower for indicator in tourism_indicators)
    
    def get_images_for_message(self, message: str, limit: int = 4) -> List[Dict]:
        """Get images based on message content - fallback method"""
        # Extract locations from user message as fallback
        locations = self.extract_location_names(message)
        
        if locations:
            return self._get_images_by_locations(locations, limit)
        
        # If no specific locations, return empty list to avoid irrelevant images
        return []
    
    def get_images_by_category(self, category: str, limit: int = 4) -> List[Dict]:
        """Get images by location category from Dashboard-managed images"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                li.image_url,
                li.image_type,
                li.caption,
                l.name as location_name,
                l.name_en as location_name_en,
                l.description,
                l.category
            FROM location_images li
            JOIN locations l ON li.location_id = l.id
            WHERE l.category = %s
            AND li.is_active = TRUE
            ORDER BY 
                CASE li.image_type 
                    WHEN 'main' THEN 1 
                    WHEN 'gallery' THEN 2 
                    ELSE 3 
                END,
                li.display_order ASC
            LIMIT %s
            """
            
            cursor.execute(query, (category, limit))
            results = cursor.fetchall()
            
            formatted_results = []
            for row in results:
                image_url = row['image_url']
                if image_url.startswith('/static/'):
                    image_url = f"http://localhost:5000{image_url}"
                
                display_name = row['location_name_en'] or row['location_name']
                
                formatted_results.append({
                    'url': image_url,
                    'alt': row['caption'] or display_name,
                    'caption': display_name,
                    'location_name': row['location_name'],
                    'category': row['category'],
                    'image_type': row['image_type']
                })
            
            return formatted_results
            
        except mysql.connector.Error as err:
            print(f"Error getting images by category: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    def get_random_images(self, limit: int = 3) -> List[Dict]:
        """Get random tourism images for general queries from Dashboard-managed images"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                li.image_url,
                li.image_type,
                li.caption,
                l.name as location_name,
                l.name_en as location_name_en,
                l.description,
                l.category
            FROM location_images li
            JOIN locations l ON li.location_id = l.id
            WHERE li.is_active = TRUE
            AND li.image_type IN ('main', 'gallery')
            ORDER BY RAND()
            LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            
            formatted_results = []
            for row in results:
                image_url = row['image_url']
                if image_url.startswith('/static/'):
                    image_url = f"http://localhost:5000{image_url}"
                
                display_name = row['location_name_en'] or row['location_name']
                
                formatted_results.append({
                    'url': image_url,
                    'alt': row['caption'] or display_name,
                    'caption': display_name,
                    'location_name': row['location_name'],
                    'category': row['category'],
                    'image_type': row['image_type']
                })
            
            return formatted_results
            
        except mysql.connector.Error as err:
            print(f"Error getting random images: {err}")
            return []
        finally:
            cursor.close()
            connection.close()

# Singleton instance
simple_image_service = SimpleImageService()