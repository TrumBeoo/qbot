from services.mongodb_chat_service import MongoDBChatService
from RAG.rag_engine import ask_question
from config.noi import detect_language, get_ai_response
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MongoDBRAGService:
    """
    Service tích hợp MongoDB chat history với RAG engine
    Đảm bảo chatbot trả lời liền mạch với context từ MongoDB
    """
    
    @staticmethod
    def chat_with_context(user_id: str, message: str, conversation_id: str = None, 
                         language: str = None) -> dict:
        """
        Chat với context từ MongoDB history
        
        Args:
            user_id: ID của user
            message: Tin nhắn từ user
            conversation_id: ID conversation (tạo mới nếu None)
            language: Ngôn ngữ (tự detect nếu None)
            
        Returns:
            Dict chứa response và metadata
        """
        try:
            # Detect language nếu chưa có
            if not language:
                language = detect_language(message)
            
            # Tạo conversation mới nếu chưa có
            if not conversation_id:
                title = message[:50] + "..." if len(message) > 50 else message
                conv_result = MongoDBChatService.create_conversation(
                    user_id, title, {"language": language}
                )
                if not conv_result["success"]:
                    raise Exception(conv_result["error"])
                conversation_id = conv_result["conversation_id"]
            
            # Lấy context từ conversation history
            context_result = MongoDBChatService.get_conversation_context(
                conversation_id, user_id, last_n_messages=10
            )
            
            conversation_context = ""
            if context_result["success"]:
                recent_messages = context_result["context"]["recent_messages"]
                if recent_messages:
                    # Tạo context string từ 5 messages gần nhất
                    context_parts = []
                    for msg in recent_messages[-5:]:
                        role = "User" if msg["role"] == "user" else "Assistant"
                        context_parts.append(f"{role}: {msg['content'][:100]}")
                    conversation_context = "\n".join(context_parts)
            
            # Lưu user message trước
            user_msg_result = MongoDBChatService.add_message(
                conversation_id, user_id, "user", message, 
                {"language": language}
            )
            
            if not user_msg_result["success"]:
                logger.warning(f"Failed to save user message: {user_msg_result['error']}")
            
            # Tạo contextual query cho RAG
            if conversation_context:
                contextual_query = f"Conversation context:\n{conversation_context}\n\nCurrent question: {message}"
            else:
                contextual_query = message
            
            # Gọi RAG engine với context
            start_time = datetime.utcnow()
            bot_response = ask_question(contextual_query, language)
            response_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Lưu bot response
            bot_metadata = {
                "language": language,
                "response_time": response_time,
                "model_version": "rag_v1",
                "has_context": bool(conversation_context)
            }
            
            bot_msg_result = MongoDBChatService.add_message(
                conversation_id, user_id, "bot", bot_response, bot_metadata
            )
            
            if not bot_msg_result["success"]:
                logger.warning(f"Failed to save bot message: {bot_msg_result['error']}")
            
            return {
                "success": True,
                "response": bot_response,
                "language": language,
                "conversation_id": conversation_id,
                "metadata": {
                    "response_time": response_time,
                    "has_context": bool(conversation_context),
                    "context_messages": len(recent_messages) if context_result["success"] else 0
                }
            }
            
        except Exception as e:
            logger.error(f"MongoDB RAG chat error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "conversation_id": conversation_id
            }
    
    @staticmethod
    def voice_chat_with_context(user_id: str, text: str, conversation_id: str = None,
                               language: str = None) -> dict:
        """
        Voice chat với context từ MongoDB history
        
        Args:
            user_id: ID của user
            text: Text từ voice input
            conversation_id: ID conversation
            language: Ngôn ngữ
            
        Returns:
            Dict chứa response và audio data
        """
        try:
            # Sử dụng chat_with_context cho logic chính
            chat_result = MongoDBRAGService.chat_with_context(
                user_id, text, conversation_id, language
            )
            
            if not chat_result["success"]:
                return chat_result
            
            # Thêm audio generation nếu cần
            # (Có thể tích hợp với voice synthesis service)
            
            return {
                **chat_result,
                "audio_available": False  # Placeholder
            }
            
        except Exception as e:
            logger.error(f"MongoDB RAG voice chat error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def get_conversation_summary(conversation_id: str, user_id: str, 
                               language: str = "vi") -> dict:
        """
        Tạo summary cho conversation
        
        Args:
            conversation_id: ID conversation
            user_id: ID user
            language: Ngôn ngữ
            
        Returns:
            Dict chứa summary
        """
        try:
            # Lấy toàn bộ conversation
            conv_result = MongoDBChatService.get_conversation(
                conversation_id, user_id, include_messages=True
            )
            
            if not conv_result["success"]:
                return conv_result
            
            conversation = conv_result["data"]
            messages = conversation.get("messages", [])
            
            if not messages:
                return {
                    "success": True,
                    "summary": "No messages in conversation" if language == "en" else "Chưa có tin nhắn trong cuộc trò chuyện"
                }
            
            # Tạo summary từ messages
            message_texts = []
            for msg in messages:
                role = "User" if msg["role"] == "user" else "Assistant"
                message_texts.append(f"{role}: {msg['content'][:200]}")
            
            conversation_text = "\n".join(message_texts)
            
            # Sử dụng AI để tạo summary
            summary_prompt = f"""
            Please summarize this conversation in {language}:
            
            {conversation_text}
            
            Provide a concise summary of the main topics discussed.
            """
            
            summary = get_ai_response(summary_prompt, language)
            
            return {
                "success": True,
                "summary": summary,
                "message_count": len(messages),
                "conversation_id": conversation_id
            }
            
        except Exception as e:
            logger.error(f"Error creating conversation summary: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Singleton instance
mongodb_rag_service = MongoDBRAGService()