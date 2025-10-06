import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def create_database_and_tables():
    """Tạo database và các bảng cần thiết cho MySQL"""
    
    # Kết nối MySQL server (không chỉ định database)
    connection = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        charset='utf8mb4'
    )
    
    cursor = connection.cursor()
    
    try:
        # Tạo database nếu chưa tồn tại
        database_name = os.getenv("MYSQL_DATABASE", "chatbot")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Database '{database_name}' created or already exists")
        
        # Chọn database
        cursor.execute(f"USE {database_name}")
        
        # Tạo bảng conversations
        create_conversations_table = """
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(500) NOT NULL DEFAULT 'New Conversation',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_updated_at (updated_at),
            INDEX idx_user_updated (user_id, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_conversations_table)
        print("Table 'conversations' created or already exists")
        
        # Tạo bảng messages
        create_messages_table = """
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(36) PRIMARY KEY,
            conversation_id VARCHAR(36) NOT NULL,
            text TEXT NOT NULL,
            sender ENUM('user', 'bot') NOT NULL,
            language VARCHAR(10) DEFAULT 'vi',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation_id (conversation_id),
            INDEX idx_timestamp (timestamp),
            INDEX idx_conversation_timestamp (conversation_id, timestamp),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_messages_table)
        print("Table 'messages' created or already exists")
        
       
        # Tạo bảng locations (địa điểm du lịch)
        create_locations_table = """
        CREATE TABLE IF NOT EXISTS locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            name_en VARCHAR(255),
            category ENUM('attraction', 'hotel', 'restaurant', 'beach', 'mountain', 'cave', 'island', 'other') DEFAULT 'attraction',
            district VARCHAR(100),
            description TEXT,
            description_en TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            keywords TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_category (category),
            INDEX idx_district (district),
            FULLTEXT idx_keywords (keywords)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_locations_table)
        print("Table 'locations' created or already exists")
        
        # Tạo bảng location_images (ảnh theo địa điểm)
        create_location_images_table = """
        CREATE TABLE IF NOT EXISTS location_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            location_id INT NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            image_type ENUM('main', 'gallery', 'thumbnail') DEFAULT 'gallery',
            caption VARCHAR(255),
            caption_en VARCHAR(255),
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_location_id (location_id),
            INDEX idx_type (image_type),
            INDEX idx_active (is_active),
            INDEX idx_order (display_order),
            FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_location_images_table)
        print("Table 'location_images' created or already exists")
        

        
        connection.commit()
        print("MySQL database setup completed successfully!")
        
    except mysql.connector.Error as err:
        print(f"Error setting up MySQL database: {err}")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    create_database_and_tables()