import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Lấy thông tin kết nối MySQL từ biến môi trường
MYSQL_CONFIG = {
    'host': os.getenv("MYSQL_HOST", "localhost"),
    'user': os.getenv("MYSQL_USER", "root"),
    'password': os.getenv("MYSQL_PASSWORD", "123456"),
    'database': os.getenv("MYSQL_DATABASE", "chatbot"),
    'port': int(os.getenv("MYSQL_PORT", 3306)),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': True,
    'raise_on_warnings': True
}

# Tạo connection pool để tối ưu hiệu suất
mysql_pool = pooling.MySQLConnectionPool(
    pool_name="chatbot_pool",
    pool_size=10,
    pool_reset_session=True,
    **MYSQL_CONFIG
)

def get_mysql_connection():
    """Lấy connection từ pool"""
    try:
        return mysql_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error getting MySQL connection: {err}")
        raise

def execute_query(query, params=None, fetch=False, fetch_one=False):
    """Thực thi query với connection pool"""
    connection = None
    cursor = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch:
            result = cursor.fetchall()
        else:
            result = cursor.rowcount
            
        connection.commit()
        return result
        
    except mysql.connector.Error as err:
        if connection:
            connection.rollback()
        print(f"MySQL Error: {err}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def execute_many(query, params_list):
    """Thực thi nhiều query cùng lúc"""
    connection = None
    cursor = None
    try:
        connection = get_mysql_connection()
        cursor = connection.cursor()
        
        cursor.executemany(query, params_list)
        connection.commit()
        return cursor.rowcount
        
    except mysql.connector.Error as err:
        if connection:
            connection.rollback()
        print(f"MySQL Error: {err}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

# Test connection khi import module
try:
    test_conn = get_mysql_connection()
    test_conn.close()
    print("✅ MySQL connection established successfully")
except Exception as e:
    print(f"❌ MySQL connection failed: {e}")