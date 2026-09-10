"""
Enhanced Chat Service with Memory Integration
Combines chat functionality with conversation memory and personalization
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from services.memory_service import MemoryService
from services.enhanced_rag_service import EnhancedRAGService
from services.mysql_chat_service import MySQLChatService
from config.noi import detect_language, get_ai_response
import logging

logger = logging.getLogger(__name__)

class EnhancedChatService:
    """
    Enhanced Chat Service that provides memory-aware conversations
    """
    
    def __init__(self):
        """Initialize Enhanced Chat Service"""
        self.memory_service = MemoryService()
        self.rag_service = EnhancedRAGService()
        
        logger.info("EnhancedChatService initialized")
    
    def chat_with_memory(self, 
                        conversation_id: str,
                        user_id: str,
                        user_message: str,
                        language: Optional[str] = None,
                        memory_type: str = "buffer_window") -> Dict[str, Any]:
        """
        Chat with memory integration
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            user_message: User's message
            language: Language preference (auto-detect if None)
            memory_type: Type of memory to use ('buffer_window' or 'summary_buffer')
        
        Returns:
            Dictionary containing chat response and metadata
        """
        try:
            # Detect language if not provided
            if not language:
                language = detect_language(user_message)
            
            logger.info(f"Processing chat with memory: conv={conversation_id}, user={user_id}, lang={language}, memory={memory_type}")
            
            # Check if this is a time/date query
            time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
            is_time_query = any(keyword in user_message.lower() for keyword in time_keywords)
            
            if is_time_query:
                # Handle time queries directly
                from app import get_current_datetime
                datetime_info = get_current_datetime()
                response_text = get_ai_response(f"{user_message}. Hiện tại là {datetime_info['datetime']}", language)
                
                # Still add to memory for context
                self.memory_service.add_message_to_memory(
                    conversation_id, user_id, user_message, response_text, memory_type
                )
                
                # Save to MySQL
                MySQLChatService.add_message_to_conversation(
                    conversation_id, user_id, user_message, response_text, language
                )
                
                return {
                    "status": "success",
                    "data": {
                        "user_message": {
                            "text": user_message,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "user"
                        },
                        "bot_response": {
                            "text": response_text,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "bot"
                        },
                        "conversation_id": conversation_id,
                        "memory_type": memory_type,
                        "query_type": "time_query"
                    },
                    "language": language
                }
            
            # Use RAG with memory for tourism queries
            rag_result = self.rag_service.ask_question_with_memory(
                user_message, conversation_id, user_id, language, memory_type
            )
            
            response_text = rag_result["response"]
            
            # Save to MySQL (RAG service already added to memory)
            MySQLChatService.add_message_to_conversation(
                conversation_id, user_id, user_message, response_text, language
            )
            
            # Get follow-up suggestions
            suggestions = self.rag_service.suggest_follow_up_questions(
                conversation_id, user_id, language
            )
            
            return {
                "status": "success",
                "data": {
                    "user_message": {
                        "text": user_message,
                        "timestamp": datetime.utcnow().isoformat(),
                        "sender": "user"
                    },
                    "bot_response": {
                        "text": response_text,
                        "timestamp": datetime.utcnow().isoformat(),
                        "sender": "bot",
                        "sources": rag_result.get("sources", []),
                        "suggestions": suggestions
                    },
                    "conversation_id": conversation_id,
                    "memory_type": memory_type,
                    "query_type": "rag_query",
                    "chat_history_length": rag_result.get("chat_history_length", 0)
                },
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Error in chat_with_memory: {e}")
            
            # Fallback to basic chat without memory
            try:
                from RAG.rag_engine import ask_question
                fallback_response = ask_question(user_message, language or 'vi')
                
                return {
                    "status": "error",
                    "data": {
                        "user_message": {
                            "text": user_message,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "user"
                        },
                        "bot_response": {
                            "text": fallback_response,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "bot"
                        },
                        "conversation_id": conversation_id,
                        "memory_type": memory_type,
                        "fallback": True
                    },
                    "language": language or 'vi',
                    "error": str(e)
                }
                
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")
                
                error_msg = self._get_friendly_error_message(language or 'vi')
                return {
                    "status": "error",
                    "data": {
                        "user_message": {
                            "text": user_message,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "user"
                        },
                        "bot_response": {
                            "text": error_msg,
                            "timestamp": datetime.utcnow().isoformat(),
                            "sender": "bot"
                        },
                        "conversation_id": conversation_id,
                        "memory_type": memory_type
                    },
                    "language": language or 'vi',
                    "error": str(e)
                }
    
    def get_conversation_context(self, 
                               conversation_id: str,
                               user_id: str,
                               memory_type: str = "buffer_window") -> Dict[str, Any]:
        """
        Get conversation context from memory
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            memory_type: Type of memory to use
        
        Returns:
            Dictionary containing conversation context
        """
        try:
            context = self.memory_service.get_conversation_context(
                conversation_id, user_id, memory_type
            )
            
            return {
                "status": "success",
                "data": context
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation context: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get user preferences analysis
        
        Args:
            user_id: User identifier
        
        Returns:
            Dictionary containing user preferences
        """
        try:
            preferences = self.memory_service.get_user_preferences(user_id)
            
            return {
                "status": "success",
                "data": preferences
            }
            
        except Exception as e:
            logger.error(f"Error getting user preferences: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def clear_conversation_memory(self, 
                                conversation_id: str,
                                user_id: str,
                                memory_type: str = "buffer_window") -> Dict[str, Any]:
        """
        Clear conversation memory
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            memory_type: Type of memory to clear
        
        Returns:
            Success status
        """
        try:
            success = self.memory_service.clear_conversation_memory(
                conversation_id, user_id, memory_type
            )
            
            return {
                "status": "success" if success else "error",
                "message": "Memory cleared successfully" if success else "Failed to clear memory"
            }
            
        except Exception as e:
            logger.error(f"Error clearing conversation memory: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_memory_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get memory system statistics
        
        Args:
            user_id: Optional user ID for user-specific stats
        
        Returns:
            Dictionary containing memory statistics
        """
        try:
            stats = self.memory_service.get_memory_stats(user_id)
            
            return {
                "status": "success",
                "data": stats
            }
            
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def cleanup_old_memories(self, days_old: int = 30) -> Dict[str, Any]:
        """
        Cleanup old memories
        
        Args:
            days_old: Remove memories older than this many days
        
        Returns:
            Cleanup statistics
        """
        try:
            cleanup_stats = self.memory_service.cleanup_old_memories(days_old)
            
            return {
                "status": "success",
                "data": cleanup_stats
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up memories: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_conversation_summary(self, 
                               conversation_id: str,
                               user_id: str,
                               language: str = 'vi') -> Dict[str, Any]:
        """
        Get conversation summary
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            language: Language for summary
        
        Returns:
            Dictionary containing conversation summary
        """
        try:
            summary = self.rag_service.get_conversation_summary(
                conversation_id, user_id, language
            )
            
            return {
                "status": "success",
                "data": summary
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation summary: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _get_friendly_error_message(self, language: str = 'vi') -> str:
        """Get friendly error message"""
        if language == 'en':
            return ("I apologize, but I'm experiencing some technical difficulties at the moment. "
                   "Please try asking your question again in a few moments.")
        else:
            return ("Xin lỗi, hiện tại tôi đang gặp một số vấn đề kỹ thuật. "
                   "Vui lòng thử hỏi lại câu hỏi sau vài phút.")


# Global enhanced chat service instance
enhanced_chat_service = EnhancedChatService()