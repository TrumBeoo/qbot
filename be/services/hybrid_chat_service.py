from services.mongodb_chat_service import MongoDBChatService
from services.mysql_chat_service import MySQLChatService
from services.enhanced_rag_service import EnhancedRAGService
from datetime import datetime
from typing import Dict, List, Optional, Any
import asyncio
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridChatService:
    """
    Hybrid Chat Service - Kết hợp MongoDB và MySQL
    
    MongoDB: Phục vụ chatbot (real-time, context, embedding)
    MySQL: Quản lý & báo cáo (structured data, analytics)
    
    Workflow:
    1. Chatbot sử dụng MongoDB để lấy context nhanh
    2. Đồng bộ dữ liệu sang MySQL cho báo cáo
    3. RAG engine tích hợp với MongoDB context
    """
    
    def __init__(self):
        self.mongodb_service = MongoDBChatService()
        self.mysql_service = MySQLChatService()
        self.rag_service = EnhancedRAGService()
    
    async def create_conversation(self, user_id: str, title: str = "New Conversation", 
                                metadata: Dict = None) -> Dict:
        """
        Tạo conversation mới trong cả MongoDB và MySQL
        
        Args:
            user_id: ID của user
            title: Tiêu đề conversation
            metadata: Metadata bổ sung
            
        Returns:
            Dict chứa thông tin conversation đã tạo
        """
        try:
            # 1. Tạo trong MongoDB (primary for chatbot)
            mongo_result = self.mongodb_service.create_conversation(
                user_id, title, metadata
            )
            
            if not mongo_result["success"]:
                return mongo_result
            
            conversation_id = mongo_result["conversation_id"]
            
            # 2. Tạo trong MySQL (for reporting) - async
            try:
                mysql_result = self.mysql_service.create_conversation(user_id, title)
                logger.info(f"Conversation {conversation_id} synced to MySQL")
            except Exception as e:
                logger.warning(f"Failed to sync conversation to MySQL: {e}")
                # Không fail toàn bộ process nếu MySQL sync lỗi
            
            return {
                "success": True,
                "conversation_id": conversation_id,
                "data": mongo_result["data"],
                "source": "mongodb_primary"
            }
            
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return {
                "success": False,
                "error": f"Error creating conversation: {str(e)}"
            }
    
    async def send_message(self, conversation_id: str, user_id: str, 
                          user_message: str, metadata: Dict = None) -> Dict:
        """
        Gửi message và nhận response từ chatbot
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            user_message: Tin nhắn từ user
            metadata: Metadata bổ sung
            
        Returns:
            Dict chứa user message và bot response
        """
        try:
            start_time = datetime.utcnow()
            
            # 1. Lấy context từ MongoDB
            context_result = self.mongodb_service.get_conversation_context(
                conversation_id, user_id, last_n_messages=10
            )
            
            if not context_result["success"]:
                return context_result
            
            context = context_result["context"]
            
            # 2. Thêm user message vào MongoDB
            user_msg_result = self.mongodb_service.add_message(
                conversation_id, user_id, "user", user_message, metadata
            )
            
            if not user_msg_result["success"]:
                return user_msg_result
            
            # 3. Tạo bot response sử dụng RAG
            try:
                # Chuẩn bị context cho RAG
                conversation_history = [
                    f"{msg['role']}: {msg['content']}" 
                    for msg in context["recent_messages"][-5:]  # 5 messages gần nhất
                ]
                
                # Gọi RAG service
                rag_response = await self.rag_service.get_response(
                    query=user_message,
                    conversation_history=conversation_history,
                    language=context.get("language", "vi")
                )
                
                bot_response = rag_response.get("response", "Xin lỗi, tôi không thể trả lời lúc này.")
                rag_sources = rag_response.get("sources", [])
                confidence = rag_response.get("confidence", 0.0)
                
            except Exception as e:
                logger.error(f"RAG service error: {e}")
                bot_response = "Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn."
                rag_sources = []
                confidence = 0.0
            
            # 4. Tính response time
            response_time = (datetime.utcnow() - start_time).total_seconds()
            
            # 5. Thêm bot response vào MongoDB
            bot_metadata = {
                "response_time": response_time,
                "confidence": confidence,
                "rag_sources": rag_sources,
                "model_version": "enhanced_rag_v1",
                "language": context.get("language", "vi")
            }
            
            bot_msg_result = self.mongodb_service.add_message(
                conversation_id, user_id, "bot", bot_response, bot_metadata
            )
            
            if not bot_msg_result["success"]:
                return bot_msg_result
            
            # 6. Sync sang MySQL (async, không block)
            asyncio.create_task(self._sync_to_mysql(
                conversation_id, user_id, user_message, bot_response, 
                context.get("language", "vi")
            ))
            
            # 7. Update context vector nếu cần
            if rag_response.get("context_vector"):
                asyncio.create_task(self.mongodb_service.update_context_vector(
                    conversation_id, user_id, rag_response["context_vector"]
                ))
            
            return {
                "success": True,
                "user_message": user_msg_result["message"],
                "bot_response": bot_msg_result["message"],
                "metadata": {
                    "response_time": response_time,
                    "confidence": confidence,
                    "sources_count": len(rag_sources),
                    "language": context.get("language", "vi")
                }
            }
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return {
                "success": False,
                "error": f"Error sending message: {str(e)}"
            }
    
    async def get_conversation(self, conversation_id: str, user_id: str, 
                             source: str = "mongodb") -> Dict:
        """
        Lấy conversation từ MongoDB hoặc MySQL
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            source: "mongodb" hoặc "mysql"
            
        Returns:
            Dict chứa thông tin conversation
        """
        try:
            if source == "mongodb":
                return self.mongodb_service.get_conversation(conversation_id, user_id)
            else:
                # MySQL - cần convert conversation_id
                mysql_result = self.mysql_service.get_conversation(conversation_id, user_id)
                return {
                    "success": True,
                    "data": mysql_result,
                    "source": "mysql"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting conversation: {str(e)}"
            }
    
    async def get_user_conversations(self, user_id: str, limit: int = 50, 
                                   skip: int = 0, source: str = "mongodb") -> Dict:
        """
        Lấy danh sách conversations của user
        
        Args:
            user_id: ID của user
            limit: Số lượng conversations tối đa
            skip: Số lượng conversations bỏ qua
            source: "mongodb" hoặc "mysql"
            
        Returns:
            Dict chứa danh sách conversations
        """
        try:
            if source == "mongodb":
                return self.mongodb_service.get_user_conversations(
                    user_id, limit, skip, include_messages=False
                )
            else:
                mysql_conversations = self.mysql_service.get_user_conversations(
                    user_id, limit, skip
                )
                return {
                    "success": True,
                    "data": mysql_conversations,
                    "source": "mysql",
                    "pagination": {
                        "total": len(mysql_conversations),
                        "limit": limit,
                        "skip": skip,
                        "has_more": len(mysql_conversations) == limit
                    }
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting user conversations: {str(e)}"
            }
    
    async def search_conversations(self, user_id: str, query: str, 
                                 limit: int = 20, source: str = "mongodb") -> Dict:
        """
        Tìm kiếm conversations
        
        Args:
            user_id: ID của user
            query: Từ khóa tìm kiếm
            limit: Số lượng kết quả tối đa
            source: "mongodb" hoặc "mysql"
            
        Returns:
            Dict chứa kết quả tìm kiếm
        """
        try:
            if source == "mongodb":
                return self.mongodb_service.search_conversations(user_id, query, limit)
            else:
                mysql_results = self.mysql_service.search_conversations(user_id, query, limit)
                return {
                    "success": True,
                    "data": mysql_results,
                    "source": "mysql",
                    "query": query,
                    "total_results": len(mysql_results)
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error searching conversations: {str(e)}"
            }
    
    async def get_analytics(self, user_id: str, conversation_id: str = None, 
                          source: str = "both") -> Dict:
        """
        Lấy analytics từ MongoDB và/hoặc MySQL
        
        Args:
            user_id: ID của user
            conversation_id: ID của conversation (optional)
            source: "mongodb", "mysql", hoặc "both"
            
        Returns:
            Dict chứa analytics data
        """
        try:
            result = {"success": True, "analytics": {}}
            
            if source in ["mongodb", "both"]:
                mongo_analytics = self.mongodb_service.get_analytics(user_id, conversation_id)
                if mongo_analytics["success"]:
                    result["analytics"]["mongodb"] = mongo_analytics["analytics"]
            
            if source in ["mysql", "both"]:
                try:
                    mysql_stats = self.mysql_service.get_conversation_stats(user_id)
                    result["analytics"]["mysql"] = mysql_stats
                except Exception as e:
                    logger.warning(f"MySQL analytics error: {e}")
                    result["analytics"]["mysql"] = {"error": str(e)}
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting analytics: {str(e)}"
            }
    
    async def delete_conversation(self, conversation_id: str, user_id: str) -> Dict:
        """
        Xóa conversation từ cả MongoDB và MySQL
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            
        Returns:
            Dict chứa kết quả xóa
        """
        try:
            results = {"mongodb": None, "mysql": None}
            
            # Xóa từ MongoDB
            mongo_result = self.mongodb_service.delete_conversation(conversation_id, user_id)
            results["mongodb"] = mongo_result
            
            # Xóa từ MySQL (nếu có)
            try:
                mysql_result = self.mysql_service.delete_conversation(conversation_id, user_id)
                results["mysql"] = {"success": True, "message": "Deleted from MySQL"}
            except Exception as e:
                logger.warning(f"MySQL delete error: {e}")
                results["mysql"] = {"success": False, "error": str(e)}
            
            return {
                "success": mongo_result["success"],
                "message": "Conversation deleted",
                "details": results
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error deleting conversation: {str(e)}"
            }
    
    async def sync_conversation_to_mysql(self, conversation_id: str, user_id: str) -> Dict:
        """
        Đồng bộ conversation từ MongoDB sang MySQL
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            
        Returns:
            Dict chứa kết quả sync
        """
        try:
            # Lấy conversation từ MongoDB
            mongo_result = self.mongodb_service.get_conversation(
                conversation_id, user_id, include_messages=True
            )
            
            if not mongo_result["success"]:
                return mongo_result
            
            conversation = mongo_result["data"]
            
            # Tạo conversation trong MySQL nếu chưa có
            try:
                mysql_conv = self.mysql_service.create_conversation(
                    user_id, conversation.get("title", "Synced Conversation")
                )
                mysql_conversation_id = mysql_conv["id"]
            except Exception:
                # Conversation có thể đã tồn tại
                mysql_conversation_id = conversation_id
            
            # Sync messages
            synced_messages = 0
            for message in conversation.get("messages", []):
                try:
                    if message["role"] == "user":
                        # Tìm bot response tiếp theo
                        bot_response = None
                        msg_index = conversation["messages"].index(message)
                        if msg_index + 1 < len(conversation["messages"]):
                            next_msg = conversation["messages"][msg_index + 1]
                            if next_msg["role"] == "bot":
                                bot_response = next_msg["content"]
                        
                        self.mysql_service.add_message_to_conversation(
                            mysql_conversation_id, user_id, 
                            message["content"], bot_response,
                            message.get("metadata", {}).get("language", "vi")
                        )
                        synced_messages += 1
                        
                except Exception as e:
                    logger.warning(f"Failed to sync message: {e}")
                    continue
            
            return {
                "success": True,
                "message": f"Synced {synced_messages} messages to MySQL",
                "mysql_conversation_id": mysql_conversation_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error syncing to MySQL: {str(e)}"
            }
    
    async def _sync_to_mysql(self, conversation_id: str, user_id: str, 
                           user_message: str, bot_response: str, language: str = "vi"):
        """
        Background task để sync message sang MySQL
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            user_message: Tin nhắn từ user
            bot_response: Phản hồi từ bot
            language: Ngôn ngữ
        """
        try:
            # Thử add message vào MySQL conversation
            self.mysql_service.add_message_to_conversation(
                conversation_id, user_id, user_message, bot_response, language
            )
            logger.info(f"Message synced to MySQL for conversation {conversation_id}")
            
        except Exception as e:
            # Nếu conversation chưa tồn tại trong MySQL, tạo mới
            try:
                self.mysql_service.create_conversation(user_id, "Synced Conversation")
                self.mysql_service.add_message_to_conversation(
                    conversation_id, user_id, user_message, bot_response, language
                )
                logger.info(f"Created new MySQL conversation and synced message")
                
            except Exception as e2:
                logger.error(f"Failed to sync to MySQL: {e2}")
    
    async def get_chatbot_context(self, conversation_id: str, user_id: str) -> Dict:
        """
        Lấy context cho chatbot từ MongoDB (tối ưu cho real-time)
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            
        Returns:
            Dict chứa context cho chatbot
        """
        return self.mongodb_service.get_conversation_context(conversation_id, user_id)
    
    async def update_conversation_context(self, conversation_id: str, user_id: str, 
                                        context_vector: List[float]) -> Dict:
        """
        Cập nhật context vector cho conversation
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            context_vector: Vector embedding
            
        Returns:
            Dict chứa kết quả update
        """
        return self.mongodb_service.update_context_vector(
            conversation_id, user_id, context_vector
        )

# Singleton instance
hybrid_chat_service = HybridChatService()