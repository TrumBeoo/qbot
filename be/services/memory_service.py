"""
Memory Service for Chatbot using LangChain Memory Components
Supports MessagesPlaceholder, HumanMessage, AIMessage with MySQL storage
"""

import os
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from langchain.memory import ConversationBufferWindowMemory, ConversationSummaryBufferMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_groq import ChatGroq
from repositories.mysql_chat_repository import MySQLChatRepository
from models.mysql_models import MySQLConversation, MySQLMessage
import logging

logger = logging.getLogger(__name__)

class MySQLChatMessageHistory(BaseChatMessageHistory):
    """Custom chat message history that stores messages in MySQL database"""
    
    def __init__(self, conversation_id: str, user_id: str):
        self.conversation_id = conversation_id
        self.user_id = user_id
        self._messages: List[BaseMessage] = []
        self._loaded = False
    
    def _load_messages(self):
        """Load messages from MySQL database"""
        if self._loaded:
            return
        
        try:
            conversation = MySQLChatRepository.find_conversation_by_id(
                self.conversation_id, self.user_id
            )
            
            if conversation and conversation.messages:
                for msg in conversation.messages:
                    if msg.sender == 'user':
                        self._messages.append(HumanMessage(content=msg.text))
                    elif msg.sender == 'bot':
                        self._messages.append(AIMessage(content=msg.text))
            
            self._loaded = True
            logger.info(f"Loaded {len(self._messages)} messages from MySQL for conversation {self.conversation_id}")
            
        except Exception as e:
            logger.error(f"Error loading messages from MySQL: {e}")
            self._messages = []
            self._loaded = True
    
    @property
    def messages(self) -> List[BaseMessage]:
        """Get all messages"""
        self._load_messages()
        return self._messages
    
    def add_message(self, message: BaseMessage) -> None:
        """Add a message to the history"""
        self._load_messages()
        self._messages.append(message)
        
        # Save to MySQL database
        try:
            if isinstance(message, HumanMessage):
                sender = 'user'
            elif isinstance(message, AIMessage):
                sender = 'bot'
            else:
                sender = 'system'
            
            mysql_message = MySQLMessage(
                text=message.content,
                sender=sender,
                language='vi',  # Default language, can be enhanced
                timestamp=datetime.utcnow(),
                conversation_id=self.conversation_id
            )
            
            MySQLChatRepository.add_messages_to_conversation(
                self.conversation_id,
                self.user_id,
                [mysql_message]
            )
            
        except Exception as e:
            logger.error(f"Error saving message to MySQL: {e}")
    
    def clear(self) -> None:
        """Clear all messages"""
        self._messages = []
        # Note: We don't delete from MySQL here to preserve history
        # Use MySQLChatRepository.delete_conversation() if needed


class MemoryService:
    """
    Enhanced Memory Service for Chatbot using LangChain Memory Components
    Supports different memory types with MySQL persistence
    """
    
    def __init__(self, 
                 window_size: int = 10,
                 max_token_limit: int = 2000,
                 summary_threshold: int = 1000):
        """
        Initialize Memory Service
        
        Args:
            window_size: Number of recent messages to keep in buffer window memory
            max_token_limit: Maximum tokens for summary buffer memory
            summary_threshold: Token threshold to trigger summarization
        """
        self.window_size = window_size
        self.max_token_limit = max_token_limit
        self.summary_threshold = summary_threshold
        
        # Cache for memory instances
        self._memory_cache: Dict[str, Any] = {}
        
        # Initialize LLM for summarization
        self._llm = None
        
        logger.info(f"MemoryService initialized with window_size={window_size}, max_token_limit={max_token_limit}")
    
    def _get_llm(self) -> ChatGroq:
        """Get or create LLM instance for summarization"""
        if self._llm is None:
            try:
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise ValueError("GROQ_API_KEY environment variable is required")
                
                self._llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    temperature=0.3,  # Lower temperature for summarization
                    groq_api_key=groq_api_key,
                    max_tokens=512
                )
                logger.info("LLM initialized for memory summarization")
                
            except Exception as e:
                logger.error(f"Failed to initialize LLM for memory: {e}")
                raise RuntimeError(f"Failed to initialize LLM: {e}")
        
        return self._llm
    
    def get_conversation_memory(self, 
                              conversation_id: str, 
                              user_id: str, 
                              memory_type: str = "buffer_window") -> Any:
        """
        Get or create conversation memory instance
        
        Args:
            conversation_id: Unique conversation identifier
            user_id: User identifier
            memory_type: Type of memory ('buffer_window' or 'summary_buffer')
        
        Returns:
            Memory instance (ConversationBufferWindowMemory or ConversationSummaryBufferMemory)
        """
        cache_key = f"{conversation_id}_{user_id}_{memory_type}"
        
        if cache_key in self._memory_cache:
            return self._memory_cache[cache_key]
        
        try:
            # Create custom chat message history
            chat_history = MySQLChatMessageHistory(conversation_id, user_id)
            
            if memory_type == "summary_buffer":
                memory = ConversationSummaryBufferMemory(
                    llm=self._get_llm(),
                    chat_memory=chat_history,
                    max_token_limit=self.max_token_limit,
                    return_messages=True,
                    memory_key="chat_history",
                    input_key="question",
                    output_key="answer"
                )
            else:  # Default to buffer_window
                memory = ConversationBufferWindowMemory(
                    chat_memory=chat_history,
                    k=self.window_size,
                    return_messages=True,
                    memory_key="chat_history",
                    input_key="question",
                    output_key="answer"
                )
            
            # Cache the memory instance
            self._memory_cache[cache_key] = memory
            
            logger.info(f"Created {memory_type} memory for conversation {conversation_id}")
            return memory
            
        except Exception as e:
            logger.error(f"Error creating memory for conversation {conversation_id}: {e}")
            raise RuntimeError(f"Failed to create memory: {e}")
    
    def add_message_to_memory(self, 
                            conversation_id: str, 
                            user_id: str, 
                            user_message: str, 
                            bot_response: str,
                            memory_type: str = "buffer_window") -> None:
        """
        Add user message and bot response to memory
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            user_message: User's message
            bot_response: Bot's response
            memory_type: Type of memory to use
        """
        try:
            memory = self.get_conversation_memory(conversation_id, user_id, memory_type)
            
            # Add messages to memory
            memory.chat_memory.add_message(HumanMessage(content=user_message))
            memory.chat_memory.add_message(AIMessage(content=bot_response))
            
            logger.info(f"Added messages to {memory_type} memory for conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Error adding messages to memory: {e}")
            raise RuntimeError(f"Failed to add messages to memory: {e}")
    
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
            memory = self.get_conversation_memory(conversation_id, user_id, memory_type)
            
            # Get memory variables
            memory_vars = memory.load_memory_variables({})
            
            # Format messages for response
            messages = []
            if "chat_history" in memory_vars:
                for msg in memory_vars["chat_history"]:
                    if isinstance(msg, HumanMessage):
                        messages.append({
                            "type": "human",
                            "content": msg.content,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    elif isinstance(msg, AIMessage):
                        messages.append({
                            "type": "ai",
                            "content": msg.content,
                            "timestamp": datetime.utcnow().isoformat()
                        })
            
            return {
                "conversation_id": conversation_id,
                "memory_type": memory_type,
                "message_count": len(messages),
                "messages": messages,
                "summary": memory_vars.get("summary", "") if memory_type == "summary_buffer" else None
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation context: {e}")
            return {
                "conversation_id": conversation_id,
                "memory_type": memory_type,
                "message_count": 0,
                "messages": [],
                "error": str(e)
            }
    
    def clear_conversation_memory(self, 
                                conversation_id: str, 
                                user_id: str,
                                memory_type: str = "buffer_window") -> bool:
        """
        Clear conversation memory (cache only, preserves database)
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            memory_type: Type of memory to clear
        
        Returns:
            True if successful
        """
        try:
            cache_key = f"{conversation_id}_{user_id}_{memory_type}"
            
            if cache_key in self._memory_cache:
                # Clear memory cache
                memory = self._memory_cache[cache_key]
                memory.clear()
                del self._memory_cache[cache_key]
                
                logger.info(f"Cleared {memory_type} memory cache for conversation {conversation_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error clearing conversation memory: {e}")
            return False
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Analyze user preferences from chat history
        
        Args:
            user_id: User identifier
        
        Returns:
            Dictionary containing user preferences analysis
        """
        try:
            # Get recent conversations for analysis
            conversations = MySQLChatRepository.find_conversations_by_user(
                user_id, limit=20, skip=0
            )
            
            if not conversations:
                return {
                    "user_id": user_id,
                    "total_conversations": 0,
                    "preferred_language": "vi",
                    "common_topics": [],
                    "interaction_patterns": {}
                }
            
            # Analyze preferences
            total_messages = 0
            language_count = {"vi": 0, "en": 0}
            topics = []
            
            for conv in conversations:
                for msg in conv.messages:
                    total_messages += 1
                    if msg.language in language_count:
                        language_count[msg.language] += 1
                    
                    # Simple topic extraction (can be enhanced with NLP)
                    if msg.sender == 'user':
                        topics.extend(self._extract_topics(msg.text))
            
            # Determine preferred language
            preferred_language = max(language_count, key=language_count.get)
            
            # Get common topics
            topic_counts = {}
            for topic in topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
            common_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "user_id": user_id,
                "total_conversations": len(conversations),
                "total_messages": total_messages,
                "preferred_language": preferred_language,
                "language_distribution": language_count,
                "common_topics": [{"topic": topic, "count": count} for topic, count in common_topics],
                "interaction_patterns": {
                    "avg_messages_per_conversation": total_messages / len(conversations) if conversations else 0,
                    "most_active_time": self._analyze_activity_time(conversations)
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user preferences: {e}")
            return {
                "user_id": user_id,
                "error": str(e)
            }
    
    def _extract_topics(self, text: str) -> List[str]:
        """
        Simple topic extraction from text
        Can be enhanced with more sophisticated NLP
        """
        # Simple keyword-based topic extraction
        tourism_keywords = {
            "hạ long": "ha_long",
            "du lịch": "travel",
            "khách sạn": "hotel",
            "nhà hàng": "restaurant",
            "ẩm thực": "food",
            "lịch trình": "itinerary",
            "vé": "ticket",
            "giá": "price",
            "thời tiết": "weather",
            "giao thông": "transport"
        }
        
        topics = []
        text_lower = text.lower()
        
        for keyword, topic in tourism_keywords.items():
            if keyword in text_lower:
                topics.append(topic)
        
        return topics
    
    def _analyze_activity_time(self, conversations: List[MySQLConversation]) -> str:
        """
        Analyze user's most active time periods
        """
        try:
            hour_counts = {}
            
            for conv in conversations:
                for msg in conv.messages:
                    if msg.sender == 'user':
                        hour = msg.timestamp.hour
                        hour_counts[hour] = hour_counts.get(hour, 0) + 1
            
            if not hour_counts:
                return "unknown"
            
            most_active_hour = max(hour_counts, key=hour_counts.get)
            
            if 6 <= most_active_hour < 12:
                return "morning"
            elif 12 <= most_active_hour < 18:
                return "afternoon"
            elif 18 <= most_active_hour < 22:
                return "evening"
            else:
                return "night"
                
        except Exception as e:
            logger.error(f"Error analyzing activity time: {e}")
            return "unknown"
    
    def personalize_response(self, 
                           response: str, 
                           user_id: str, 
                           conversation_id: str) -> str:
        """
        Personalize bot response based on user preferences
        
        Args:
            response: Original bot response
            user_id: User identifier
            conversation_id: Conversation identifier
        
        Returns:
            Personalized response
        """
        try:
            preferences = self.get_user_preferences(user_id)
            
            # Simple personalization based on preferences
            if preferences.get("common_topics"):
                top_topic = preferences["common_topics"][0]["topic"]
                
                # Add personalized suggestions based on user's interests
                if top_topic == "ha_long" and "hạ long" not in response.lower():
                    response += "\n\n💡 Bạn có vẻ quan tâm đến Vịnh Hạ Long. Tôi có thể chia sẻ thêm thông tin về địa điểm này nếu bạn muốn!"
                elif top_topic == "food" and "ẩm thực" not in response.lower():
                    response += "\n\n🍜 Dựa trên sở thích của bạn, tôi có thể gợi ý thêm về ẩm thực địa phương!"
            
            return response
            
        except Exception as e:
            logger.error(f"Error personalizing response: {e}")
            return response
    
    def get_memory_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get memory system statistics
        
        Args:
            user_id: Optional user ID for user-specific stats
        
        Returns:
            Dictionary containing memory statistics
        """
        try:
            stats = {
                "active_memory_instances": len(self._memory_cache),
                "memory_types": {
                    "buffer_window": 0,
                    "summary_buffer": 0
                }
            }
            
            # Count memory types in cache
            for cache_key in self._memory_cache:
                if "buffer_window" in cache_key:
                    stats["memory_types"]["buffer_window"] += 1
                elif "summary_buffer" in cache_key:
                    stats["memory_types"]["summary_buffer"] += 1
            
            if user_id:
                # Get user-specific stats
                user_conversations = MySQLChatRepository.find_conversations_by_user(
                    user_id, limit=1000, skip=0
                )
                
                stats["user_stats"] = {
                    "total_conversations": len(user_conversations),
                    "total_messages": sum(conv.get_message_count() for conv in user_conversations),
                    "active_memories": len([k for k in self._memory_cache if user_id in k])
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {"error": str(e)}
    
    def cleanup_old_memories(self, days_old: int = 30) -> Dict[str, Any]:
        """
        Cleanup old memory instances from cache
        
        Args:
            days_old: Remove memories older than this many days
        
        Returns:
            Cleanup statistics
        """
        try:
            initial_count = len(self._memory_cache)
            
            # For now, just clear all cache (can be enhanced to check timestamps)
            # In production, you'd want to track memory creation timestamps
            self._memory_cache.clear()
            
            cleaned_count = initial_count
            
            logger.info(f"Cleaned up {cleaned_count} memory instances from cache")
            
            return {
                "cleaned_memories": cleaned_count,
                "remaining_memories": len(self._memory_cache),
                "cleanup_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up memories: {e}")
            return {"error": str(e)}


# Global memory service instance
memory_service = MemoryService()