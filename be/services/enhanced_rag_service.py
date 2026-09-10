"""
Enhanced RAG Service with Memory Integration
Combines RAG capabilities with conversation memory using LangChain
"""

import os
from typing import Optional, Dict, Any, List
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.schema import BaseMessage
from langchain_groq import ChatGroq
from RAG.rag_engine import RAGEngine
from services.memory_service import MemoryService
import logging

logger = logging.getLogger(__name__)

class EnhancedRAGService:
    """
    Enhanced RAG Service that combines document retrieval with conversation memory
    """
    
    def __init__(self):
        """Initialize Enhanced RAG Service"""
        self.rag_engine = RAGEngine()
        self.memory_service = MemoryService()
        self._conversational_chains = {}  # Cache for conversational chains
        
        logger.info("EnhancedRAGService initialized")
    
    def _get_conversational_chain(self, language: str = 'vi') -> ConversationalRetrievalChain:
        """
        Get or create conversational retrieval chain
        
        Args:
            language: Language for the conversation
        
        Returns:
            ConversationalRetrievalChain instance
        """
        if language in self._conversational_chains:
            return self._conversational_chains[language]
        
        try:
            # Get LLM and vectorstore from RAG engine
            llm = self.rag_engine._get_llm()
            vectorstore = self.rag_engine._load_vectorstore()
            
            # Create custom prompt for conversational RAG
            if language == 'en':
                template = """
                You are QBot, a smart travel assistant for Quang Ninh Province, Vietnam.
                Use the following context and chat history to answer the question.
                
                When answering:
                - Respond in English
                - Use information from both the context and previous conversation
                - If the question refers to something mentioned earlier, acknowledge it
                - Provide accurate and helpful travel information
                - Stay focused on Quang Ninh Province tourism
                
                Context from documents:
                {context}
                
                Chat History:
                {chat_history}
                
                Current Question: {question}
                
                Answer:
                """
            else:
                template = """
                Bạn là QBot, trợ lý du lịch thông minh của tỉnh Quảng Ninh, Việt Nam.
                Sử dụng thông tin từ tài liệu và lịch sử trò chuyện để trả lời câu hỏi.
                
                Khi trả lời:
                - Trả lời bằng tiếng Việt
                - Sử dụng thông tin từ cả tài liệu và cuộc trò chuyện trước đó
                - Nếu câu hỏi liên quan đến điều đã thảo luận trước đó, hãy nhắc lại
                - Cung cấp thông tin du lịch chính xác và hữu ích
                - Tập trung vào du lịch tỉnh Quảng Ninh
                
                Thông tin từ tài liệu:
                {context}
                
                Lịch sử trò chuyện:
                {chat_history}
                
                Câu hỏi hiện tại: {question}
                
                Câu trả lời:
                """
            
            # Create custom prompt
            custom_prompt = PromptTemplate(
                template=template,
                input_variables=["context", "chat_history", "question"]
            )
            
            # Create conversational retrieval chain
            chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 4}
                ),
                combine_docs_chain_kwargs={"prompt": custom_prompt},
                return_source_documents=True,
                verbose=True
            )
            
            # Cache the chain
            self._conversational_chains[language] = chain
            
            logger.info(f"Created conversational chain for language: {language}")
            return chain
            
        except Exception as e:
            logger.error(f"Error creating conversational chain: {e}")
            raise RuntimeError(f"Failed to create conversational chain: {e}")
    
    def ask_question_with_memory(self, 
                               query: str,
                               conversation_id: str,
                               user_id: str,
                               language: str = 'vi',
                               memory_type: str = "buffer_window") -> Dict[str, Any]:
        """
        Ask question using RAG with conversation memory
        
        Args:
            query: User's question
            conversation_id: Conversation identifier
            user_id: User identifier
            language: Language for response
            memory_type: Type of memory to use
        
        Returns:
            Dictionary containing response and metadata
        """
        try:
            # Get conversation memory
            memory = self.memory_service.get_conversation_memory(
                conversation_id, user_id, memory_type
            )
            
            # Get conversational chain
            chain = self._get_conversational_chain(language)
            
            # Get chat history from memory
            chat_history = []
            memory_vars = memory.load_memory_variables({})
            
            if "chat_history" in memory_vars:
                # Convert messages to tuples for ConversationalRetrievalChain
                messages = memory_vars["chat_history"]
                for i in range(0, len(messages), 2):
                    if i + 1 < len(messages):
                        human_msg = messages[i]
                        ai_msg = messages[i + 1]
                        if hasattr(human_msg, 'content') and hasattr(ai_msg, 'content'):
                            chat_history.append((human_msg.content, ai_msg.content))
            
            # Ask question with context
            result = chain({
                "question": query,
                "chat_history": chat_history
            })
            
            response_text = result["answer"]
            source_docs = result.get("source_documents", [])
            
            # Personalize response
            personalized_response = self.memory_service.personalize_response(
                response_text, user_id, conversation_id
            )
            
            # Add messages to memory
            self.memory_service.add_message_to_memory(
                conversation_id, user_id, query, personalized_response, memory_type
            )
            
            # Prepare source information
            sources = []
            for doc in source_docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata
                })
            
            return {
                "response": personalized_response,
                "original_response": response_text,
                "sources": sources,
                "conversation_id": conversation_id,
                "memory_type": memory_type,
                "language": language,
                "chat_history_length": len(chat_history)
            }
            
        except Exception as e:
            logger.error(f"Error in ask_question_with_memory: {e}")
            
            # Fallback to regular RAG without memory
            try:
                fallback_response = self.rag_engine.ask_question(query, language)
                return {
                    "response": fallback_response,
                    "sources": [],
                    "conversation_id": conversation_id,
                    "memory_type": memory_type,
                    "language": language,
                    "fallback": True,
                    "error": str(e)
                }
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")
                
                # Return friendly error message
                error_msg = self._get_friendly_error_message(language)
                return {
                    "response": error_msg,
                    "sources": [],
                    "conversation_id": conversation_id,
                    "memory_type": memory_type,
                    "language": language,
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
    
    def get_conversation_summary(self, 
                               conversation_id: str,
                               user_id: str,
                               language: str = 'vi') -> Dict[str, Any]:
        """
        Get conversation summary using memory
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            language: Language for summary
        
        Returns:
            Dictionary containing conversation summary
        """
        try:
            # Get conversation context from memory
            context = self.memory_service.get_conversation_context(
                conversation_id, user_id, "summary_buffer"
            )
            
            if context.get("summary"):
                return {
                    "conversation_id": conversation_id,
                    "summary": context["summary"],
                    "message_count": context["message_count"],
                    "language": language
                }
            
            # If no summary available, create one using LLM
            if context.get("messages"):
                llm = self.rag_engine._get_llm()
                
                # Prepare conversation text
                conversation_text = ""
                for msg in context["messages"]:
                    role = "Người dùng" if msg["type"] == "human" else "QBot"
                    conversation_text += f"{role}: {msg['content']}\n"
                
                # Create summary prompt
                if language == 'en':
                    summary_prompt = f"""
                    Summarize the following conversation between a user and QBot (travel assistant for Quang Ninh Province):
                    
                    {conversation_text}
                    
                    Provide a concise summary in English highlighting:
                    - Main topics discussed
                    - Key information provided
                    - User's interests or preferences
                    
                    Summary:
                    """
                else:
                    summary_prompt = f"""
                    Tóm tắt cuộc trò chuyện sau đây giữa người dùng và QBot (trợ lý du lịch tỉnh Quảng Ninh):
                    
                    {conversation_text}
                    
                    Cung cấp tóm tắt ngắn gọn bằng tiếng Việt bao gồm:
                    - Các chủ đề chính đã thảo luận
                    - Thông tin quan trọng đã cung cấp
                    - Sở thích hoặc quan tâm của người dùng
                    
                    Tóm tắt:
                    """
                
                summary = llm.predict(summary_prompt)
                
                return {
                    "conversation_id": conversation_id,
                    "summary": summary,
                    "message_count": context["message_count"],
                    "language": language,
                    "generated": True
                }
            
            return {
                "conversation_id": conversation_id,
                "summary": "Chưa có đủ thông tin để tạo tóm tắt" if language == 'vi' else "Not enough information to create summary",
                "message_count": 0,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Error creating conversation summary: {e}")
            return {
                "conversation_id": conversation_id,
                "error": str(e),
                "language": language
            }
    
    def suggest_follow_up_questions(self, 
                                  conversation_id: str,
                                  user_id: str,
                                  language: str = 'vi') -> List[str]:
        """
        Suggest follow-up questions based on conversation history
        
        Args:
            conversation_id: Conversation identifier
            user_id: User identifier
            language: Language for suggestions
        
        Returns:
            List of suggested questions
        """
        try:
            # Get conversation context
            context = self.memory_service.get_conversation_context(
                conversation_id, user_id, "buffer_window"
            )
            
            if not context.get("messages"):
                # Return default suggestions for new conversations
                if language == 'en':
                    return [
                        "What are the top attractions in Ha Long Bay?",
                        "Can you recommend a 2-day itinerary for Quang Ninh?",
                        "What are the best hotels in Ha Long City?",
                        "What local dishes should I try in Quang Ninh?"
                    ]
                else:
                    return [
                        "Những địa điểm tham quan nổi tiếng nhất ở Vịnh Hạ Long là gì?",
                        "Bạn có thể gợi ý lịch trình 2 ngày cho Quảng Ninh không?",
                        "Khách sạn tốt nhất ở thành phố Hạ Long là gì?",
                        "Tôi nên thử món ăn địa phương nào ở Quảng Ninh?"
                    ]
            
            # Analyze recent messages to suggest relevant follow-ups
            recent_messages = context["messages"][-4:]  # Last 4 messages
            user_messages = [msg["content"] for msg in recent_messages if msg["type"] == "human"]
            
            if not user_messages:
                return []
            
            # Use LLM to generate contextual suggestions
            llm = self.rag_engine._get_llm()
            
            conversation_context = "\n".join([f"- {msg}" for msg in user_messages])
            
            if language == 'en':
                suggestion_prompt = f"""
                Based on this conversation about Quang Ninh tourism:
                {conversation_context}
                
                Suggest 3-4 relevant follow-up questions the user might want to ask.
                Focus on practical travel information for Quang Ninh Province.
                
                Format as a simple list, one question per line.
                """
            else:
                suggestion_prompt = f"""
                Dựa trên cuộc trò chuyện về du lịch Quảng Ninh này:
                {conversation_context}
                
                Gợi ý 3-4 câu hỏi tiếp theo phù hợp mà người dùng có thể muốn hỏi.
                Tập trung vào thông tin du lịch thực tế cho tỉnh Quảng Ninh.
                
                Định dạng dưới dạng danh sách đơn giản, mỗi câu hỏi một dòng.
                """
            
            suggestions_text = llm.predict(suggestion_prompt)
            
            # Parse suggestions
            suggestions = []
            for line in suggestions_text.strip().split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    # Remove bullet points or numbers
                    line = line.lstrip('- •123456789. ')
                    if line:
                        suggestions.append(line)
            
            return suggestions[:4]  # Limit to 4 suggestions
            
        except Exception as e:
            logger.error(f"Error generating follow-up suggestions: {e}")
            return []
    
    async def get_response(self, query: str, conversation_history: List[str] = None, 
                          language: str = 'vi') -> Dict[str, Any]:
        """
        Get response for MongoDB chat service (async compatible)
        
        Args:
            query: User's question
            conversation_history: List of previous messages
            language: Language for response
        
        Returns:
            Dictionary containing response and metadata
        """
        try:
            # Use regular RAG engine for now
            response_text = self.rag_engine.ask_question(query, language)
            
            # Get source documents for context
            vectorstore = self.rag_engine._load_vectorstore()
            docs = vectorstore.similarity_search(query, k=3)
            
            sources = []
            for doc in docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata
                })
            
            return {
                "response": response_text,
                "sources": sources,
                "confidence": 0.8,  # Default confidence
                "language": language,
                "context_vector": []  # Could add embedding here if needed
            }
            
        except Exception as e:
            logger.error(f"Error in get_response: {e}")
            
            # Return friendly error message
            error_msg = self._get_friendly_error_message(language)
            return {
                "response": error_msg,
                "sources": [],
                "confidence": 0.0,
                "language": language,
                "error": str(e)
            }


# Global enhanced RAG service instance
enhanced_rag_service = EnhancedRAGService()