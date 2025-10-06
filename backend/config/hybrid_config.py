"""
Configuration for Hybrid Database System
"""

import os
from dotenv import load_dotenv

load_dotenv()

class HybridConfig:
    """Configuration class for hybrid database system"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv("MONGO_URI")
    MONGODB_DATABASE = "chatbot_AI"
    MONGODB_TIMEOUT = 10000  # 10 seconds
    
    # MySQL Configuration
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "chatbot")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    
    # Sync Configuration
    SYNC_ENABLED = True
    SYNC_RETRY_ATTEMPTS = 3
    SYNC_RETRY_DELAY = 1  # seconds
    BACKGROUND_SYNC = True
    
    # Chat Configuration
    DEFAULT_LANGUAGE = "vi"
    MAX_MESSAGES_PER_CONVERSATION = 1000
    CONTEXT_WINDOW_SIZE = 10
    
    # RAG Configuration
    RAG_CONFIDENCE_THRESHOLD = 0.7
    RAG_MAX_SOURCES = 5
    RAG_TIMEOUT = 30  # seconds
    
    # Performance Configuration
    MONGODB_CONNECTION_POOL_SIZE = 10
    MYSQL_CONNECTION_POOL_SIZE = 10
    CACHE_TTL = 300  # 5 minutes
    
    # Error Handling
    MAX_RETRY_ATTEMPTS = 3
    FALLBACK_ENABLED = True
    ERROR_LOGGING_ENABLED = True
    
    @classmethod
    def get_mongodb_config(cls):
        """Get MongoDB configuration"""
        return {
            "uri": cls.MONGODB_URI,
            "database": cls.MONGODB_DATABASE,
            "timeout": cls.MONGODB_TIMEOUT
        }
    
    @classmethod
    def get_mysql_config(cls):
        """Get MySQL configuration"""
        return {
            "host": cls.MYSQL_HOST,
            "user": cls.MYSQL_USER,
            "password": cls.MYSQL_PASSWORD,
            "database": cls.MYSQL_DATABASE,
            "port": cls.MYSQL_PORT
        }
    
    @classmethod
    def get_sync_config(cls):
        """Get sync configuration"""
        return {
            "enabled": cls.SYNC_ENABLED,
            "retry_attempts": cls.SYNC_RETRY_ATTEMPTS,
            "retry_delay": cls.SYNC_RETRY_DELAY,
            "background": cls.BACKGROUND_SYNC
        }

# Global config instance
config = HybridConfig()