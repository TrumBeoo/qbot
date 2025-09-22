# services/analytics_service.py
import os
import mysql.connector
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for advanced analytics and reporting"""
    
    @staticmethod
    def get_mysql_connection():
        """Get MySQL database connection"""
        return mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DATABASE', 'chatbot'),
            charset='utf8mb4'
        )
    
    @staticmethod
    def get_user_analytics(user_id: str) -> Dict[str, Any]:
        """Get analytics data for a specific user"""
        try:
            connection = AnalyticsService.get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Get user's conversations
            cursor.execute(
                "SELECT COUNT(*) as total FROM conversations WHERE user_id = %s",
                (user_id,)
            )
            user_conversations = cursor.fetchone()['total']
            
            # Get user's messages
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM messages m 
                JOIN conversations c ON m.conversation_id = c.id 
                WHERE c.user_id = %s
            """, (user_id,))
            user_messages = cursor.fetchone()['total']
            
            # Get user's recent activity (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            cursor.execute(
                "SELECT COUNT(*) as recent FROM conversations WHERE user_id = %s AND updated_at >= %s",
                (user_id, thirty_days_ago)
            )
            recent_conversations = cursor.fetchone()['recent']
            
            # Get user's language usage
            cursor.execute("""
                SELECT m.language, COUNT(*) as count 
                FROM messages m 
                JOIN conversations c ON m.conversation_id = c.id 
                WHERE c.user_id = %s AND m.language IS NOT NULL 
                GROUP BY m.language 
                ORDER BY count DESC
            """, (user_id,))
            user_languages = cursor.fetchall()
            
            # Get user's daily activity for last 7 days
            daily_activity = []
            for i in range(7):
                date = datetime.now() - timedelta(days=i)
                start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = start_of_day + timedelta(days=1)
                
                cursor.execute("""
                    SELECT COUNT(*) as daily_conversations,
                           COUNT(DISTINCT m.id) as daily_messages
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    WHERE c.user_id = %s AND c.updated_at >= %s AND c.updated_at < %s
                """, (user_id, start_of_day, end_of_day))
                
                daily_data = cursor.fetchone()
                daily_activity.append({
                    "date": start_of_day.strftime("%Y-%m-%d"),
                    "conversations": daily_data['daily_conversations'] or 0,
                    "messages": daily_data['daily_messages'] or 0
                })
            
            cursor.close()
            connection.close()
            
            return {
                "user_stats": {
                    "total_conversations": user_conversations,
                    "total_messages": user_messages,
                    "recent_conversations": recent_conversations,
                    "avg_messages_per_conversation": round(user_messages / user_conversations, 2) if user_conversations > 0 else 0
                },
                "language_usage": user_languages,
                "daily_activity": daily_activity[::-1]  # Reverse to show oldest first
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_comprehensive_analytics() -> Dict[str, Any]:
        """Get comprehensive system analytics"""
        try:
            connection = AnalyticsService.get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Overall statistics
            cursor.execute("SELECT COUNT(*) as total FROM conversations")
            total_conversations = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(*) as total FROM messages")
            total_messages = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(DISTINCT user_id) as active FROM conversations")
            active_users = cursor.fetchone()['active']
            
            # Recent activity (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            cursor.execute(
                "SELECT COUNT(*) as recent FROM conversations WHERE updated_at >= %s",
                (thirty_days_ago,)
            )
            recent_conversations = cursor.fetchone()['recent']
            
            cursor.execute("""
                SELECT COUNT(*) as recent 
                FROM messages m 
                JOIN conversations c ON m.conversation_id = c.id 
                WHERE c.updated_at >= %s
            """, (thirty_days_ago,))
            recent_messages = cursor.fetchone()['recent']
            
            # Hourly distribution
            cursor.execute("""
                SELECT HOUR(timestamp) as hour, COUNT(*) as count 
                FROM messages 
                WHERE timestamp >= %s
                GROUP BY HOUR(timestamp) 
                ORDER BY hour
            """, (thirty_days_ago,))
            hourly_distribution = cursor.fetchall()
            
            # Daily statistics for last 30 days
            daily_stats = []
            for i in range(30):
                date = datetime.now() - timedelta(days=i)
                start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = start_of_day + timedelta(days=1)
                
                cursor.execute("""
                    SELECT 
                        COUNT(DISTINCT c.id) as conversations,
                        COUNT(m.id) as messages,
                        COUNT(DISTINCT c.user_id) as unique_users
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    WHERE c.updated_at >= %s AND c.updated_at < %s
                """, (start_of_day, end_of_day))
                
                daily_data = cursor.fetchone()
                daily_stats.append({
                    "date": start_of_day.strftime("%Y-%m-%d"),
                    "conversations": daily_data['conversations'] or 0,
                    "messages": daily_data['messages'] or 0,
                    "unique_users": daily_data['unique_users'] or 0
                })
            
            # Language distribution
            cursor.execute("""
                SELECT language, COUNT(*) as count 
                FROM messages 
                WHERE language IS NOT NULL 
                GROUP BY language 
                ORDER BY count DESC
            """)
            language_distribution = cursor.fetchall()
            
            # Top active users
            cursor.execute("""
                SELECT 
                    c.user_id,
                    COUNT(DISTINCT c.id) as conversations,
                    COUNT(m.id) as messages,
                    MAX(c.updated_at) as last_activity
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                GROUP BY c.user_id
                ORDER BY conversations DESC
                LIMIT 10
            """)
            top_users = cursor.fetchall()
            
            # Message length analysis
            cursor.execute("""
                SELECT 
                    AVG(CHAR_LENGTH(text)) as avg_length,
                    MIN(CHAR_LENGTH(text)) as min_length,
                    MAX(CHAR_LENGTH(text)) as max_length
                FROM messages 
                WHERE sender = 'user'
            """)
            message_stats = cursor.fetchone()
            
            cursor.close()
            connection.close()
            
            return {
                "overview": {
                    "total_conversations": total_conversations,
                    "total_messages": total_messages,
                    "active_users": active_users,
                    "recent_conversations": recent_conversations,
                    "recent_messages": recent_messages,
                    "avg_messages_per_conversation": round(total_messages / total_conversations, 2) if total_conversations > 0 else 0
                },
                "daily_stats": daily_stats[::-1],  # Reverse to show oldest first
                "hourly_distribution": hourly_distribution,
                "language_distribution": language_distribution,
                "top_users": top_users,
                "message_analysis": {
                    "avg_user_message_length": round(message_stats['avg_length'], 2) if message_stats['avg_length'] else 0,
                    "min_message_length": message_stats['min_length'] or 0,
                    "max_message_length": message_stats['max_length'] or 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting comprehensive analytics: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_conversation_insights(user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get detailed conversation insights"""
        try:
            connection = AnalyticsService.get_mysql_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Base query conditions
            user_condition = "WHERE c.user_id = %s" if user_id else ""
            params = [user_id] if user_id else []
            
            # Average conversation length
            cursor.execute(f"""
                SELECT 
                    AVG(message_count) as avg_length,
                    MIN(message_count) as min_length,
                    MAX(message_count) as max_length
                FROM (
                    SELECT c.id, COUNT(m.id) as message_count
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    {user_condition}
                    GROUP BY c.id
                ) as conv_lengths
            """, params)
            length_stats = cursor.fetchone()
            
            # Conversation duration analysis
            cursor.execute(f"""
                SELECT 
                    c.id,
                    MIN(m.timestamp) as first_message,
                    MAX(m.timestamp) as last_message,
                    TIMESTAMPDIFF(MINUTE, MIN(m.timestamp), MAX(m.timestamp)) as duration_minutes
                FROM conversations c
                JOIN messages m ON c.id = m.conversation_id
                {user_condition}
                GROUP BY c.id
                HAVING COUNT(m.id) > 1
            """, params)
            duration_data = cursor.fetchall()
            
            # Calculate average duration
            avg_duration = 0
            if duration_data:
                total_duration = sum(d['duration_minutes'] or 0 for d in duration_data)
                avg_duration = round(total_duration / len(duration_data), 2)
            
            # Most active time periods
            cursor.execute(f"""
                SELECT 
                    CASE 
                        WHEN HOUR(m.timestamp) BETWEEN 6 AND 11 THEN 'Morning'
                        WHEN HOUR(m.timestamp) BETWEEN 12 AND 17 THEN 'Afternoon'
                        WHEN HOUR(m.timestamp) BETWEEN 18 AND 22 THEN 'Evening'
                        ELSE 'Night'
                    END as time_period,
                    COUNT(*) as message_count
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                {user_condition}
                GROUP BY time_period
                ORDER BY message_count DESC
            """, params)
            time_periods = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            return {
                "conversation_length": {
                    "avg_messages": round(length_stats['avg_length'], 2) if length_stats['avg_length'] else 0,
                    "min_messages": length_stats['min_length'] or 0,
                    "max_messages": length_stats['max_length'] or 0
                },
                "conversation_duration": {
                    "avg_duration_minutes": avg_duration,
                    "total_analyzed": len(duration_data)
                },
                "activity_by_time": time_periods
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation insights: {e}")
            return {"error": str(e)}