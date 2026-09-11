# services/chatbot_service.py
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from RAG.rag_engine import get_rag_engine
from MongoDB.db import users_collection
import logging
import mysql.connector

logger = logging.getLogger(__name__)

class ChatbotService:
    """Service for managing chatbot operations and statistics"""
    
    @staticmethod
    def get_mysql_connection():
        """Get MySQL database connection"""
        return mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DATABASE', 'chatbot')
        )
    
    @staticmethod
    def get_chatbot_stats() -> Dict[str, Any]:
        """Get comprehensive chatbot statistics"""
        try:
            rag_engine = get_rag_engine()
            rag_stats = rag_engine.get_stats()
            
            # Get chat statistics from MySQL database
            connection = ChatbotService.get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Get total conversations
            cursor.execute("SELECT COUNT(*) as total FROM conversations")
            total_conversations = cursor.fetchone()['total']
            
            # Get conversations from last 30 days
            thirty_days_ago = datetime.now() - timedelta(days=30)
            cursor.execute(
                "SELECT COUNT(*) as recent FROM conversations WHERE updated_at >= %s",
                (thirty_days_ago,)
            )
            recent_conversations = cursor.fetchone()['recent']
            
            # Get total messages count
            cursor.execute("SELECT COUNT(*) as total FROM messages")
            total_messages = cursor.fetchone()['total']
            
            # Get active users (users who have conversations)
            cursor.execute("SELECT COUNT(DISTINCT user_id) as active FROM conversations")
            active_users = cursor.fetchone()['active']
            
            # Get language distribution
            cursor.execute(
                "SELECT language, COUNT(*) as count FROM messages WHERE language IS NOT NULL GROUP BY language ORDER BY count DESC"
            )
            language_stats = [{'_id': row['language'], 'count': row['count']} for row in cursor.fetchall()]
            
            # Get daily conversation stats for last 7 days
            daily_stats = []
            for i in range(7):
                date = datetime.now() - timedelta(days=i)
                start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = start_of_day + timedelta(days=1)
                
                cursor.execute(
                    "SELECT COUNT(*) as daily_count FROM conversations WHERE updated_at >= %s AND updated_at < %s",
                    (start_of_day, end_of_day)
                )
                daily_count = cursor.fetchone()['daily_count']
                
                daily_stats.append({
                    "date": start_of_day.strftime("%Y-%m-%d"),
                    "conversations": daily_count
                })
            
            cursor.close()
            connection.close()
            
            return {
                "rag_system": rag_stats,
                "conversations": {
                    "total": total_conversations,
                    "recent_30_days": recent_conversations,
                    "total_messages": total_messages,
                    "active_users": active_users
                },
                "language_distribution": language_stats,
                "daily_stats": daily_stats[::-1]  # Reverse to show oldest first
            }
            
        except Exception as e:
            logger.error(f"Error getting chatbot stats: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_data_sources() -> List[Dict[str, Any]]:
        """Get information about data sources in the RAG system"""
        try:
            rag_engine = get_rag_engine()
            data_dir = rag_engine.data_dir
            
            if not os.path.exists(data_dir):
                return []
            
            sources = []
            for filename in os.listdir(data_dir):
                filepath = os.path.join(data_dir, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    sources.append({
                        "filename": filename,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "extension": os.path.splitext(filename)[1]
                    })
            
            return sorted(sources, key=lambda x: x["modified"], reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting data sources: {e}")
            return []
    
    @staticmethod
    def add_data_source(filename: str, content: str) -> Dict[str, Any]:
        """Add a new data source file"""
        try:
            rag_engine = get_rag_engine()
            data_dir = rag_engine.data_dir
            
            # Ensure data directory exists
            os.makedirs(data_dir, exist_ok=True)
            
            filepath = os.path.join(data_dir, filename)
            
            # Check if file already exists
            if os.path.exists(filepath):
                return {"error": "File already exists"}
            
            # Write content to file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Rebuild vector store
            rag_engine.create_vector_store(force_rebuild=True)
            
            return {
                "success": True,
                "message": f"File {filename} added successfully",
                "filename": filename
            }
            
        except Exception as e:
            logger.error(f"Error adding data source: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def update_data_source(filename: str, content: str) -> Dict[str, Any]:
        """Update an existing data source file"""
        try:
            rag_engine = get_rag_engine()
            data_dir = rag_engine.data_dir
            filepath = os.path.join(data_dir, filename)
            
            if not os.path.exists(filepath):
                return {"error": "File not found"}
            
            # Write updated content to file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Rebuild vector store
            rag_engine.create_vector_store(force_rebuild=True)
            
            return {
                "success": True,
                "message": f"File {filename} updated successfully",
                "filename": filename
            }
            
        except Exception as e:
            logger.error(f"Error updating data source: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def delete_data_source(filename: str) -> Dict[str, Any]:
        """Delete a data source file"""
        try:
            rag_engine = get_rag_engine()
            data_dir = rag_engine.data_dir
            filepath = os.path.join(data_dir, filename)
            
            if not os.path.exists(filepath):
                return {"error": "File not found"}
            
            # Delete file
            os.remove(filepath)
            
            # Rebuild vector store
            rag_engine.create_vector_store(force_rebuild=True)
            
            return {
                "success": True,
                "message": f"File {filename} deleted successfully",
                "filename": filename
            }
            
        except Exception as e:
            logger.error(f"Error deleting data source: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_file_content(filename: str) -> Dict[str, Any]:
        """Get content of a data source file"""
        try:
            rag_engine = get_rag_engine()
            data_dir = rag_engine.data_dir
            filepath = os.path.join(data_dir, filename)
            
            if not os.path.exists(filepath):
                return {"error": "File not found"}
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                "filename": filename,
                "content": content
            }
            
        except Exception as e:
            logger.error(f"Error reading file content: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def test_chatbot(query: str, language: str = 'vi') -> Dict[str, Any]:
        """Test chatbot with a query"""
        try:
            rag_engine = get_rag_engine()
            response = rag_engine.ask_question(query, language, return_sources=True)
            
            return {
                "success": True,
                "query": query,
                "language": language,
                "response": response
            }
            
        except Exception as e:
            logger.error(f"Error testing chatbot: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def rebuild_vectorstore() -> Dict[str, Any]:
        """Rebuild the vector store"""
        try:
            rag_engine = get_rag_engine()
            rag_engine.create_vector_store(force_rebuild=True)
            
            return {
                "success": True,
                "message": "Vector store rebuilt successfully"
            }
            
        except Exception as e:
            logger.error(f"Error rebuilding vector store: {e}")
            return {"error": str(e)}