import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA, ConversationalRetrievalChain
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.schema import Document                                                       
from dotenv import load_dotenv
from RAG.loader import DocumentLoader
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    """Enhanced RAG Engine with better error handling, caching, and configuration."""
    
    def __init__(self, 
                 data_dir: str = "data/", 
                 vectorstore_path: str = "vectorstore/index",
                 embedding_model: str = "sentence-transformers/distiluse-base-multilingual-cased-v1",
                 llm_model: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
                 chunk_size: int = 1000,
                 chunk_overlap: int = 200,
                 temperature: float = 0.7):
        """
        Initialize RAG Engine with configurable parameters.
        
        Args:
            data_dir: Directory containing source documents
            vectorstore_path: Path to save/load vector store
            embedding_model: HuggingFace embedding model name
            llm_model: Groq LLM model name
            chunk_size: Text chunk size for splitting
            chunk_overlap: Overlap between chunks
            temperature: LLM temperature setting
        """
        self.data_dir = data_dir
        self.vectorstore_path = vectorstore_path
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.temperature = temperature
        
        # Initialize components
        self.embeddings = None
        self.vectorstore = None
        self._qa_chain = None
        self._llm = None
        
        # Metadata file for tracking updates
        self.metadata_path = os.path.join(os.path.dirname(vectorstore_path), "metadata.json")
        
        # Initialize embeddings
        self._load_embeddings()
    
    def _load_embeddings(self) -> None:
        """Initialize embeddings model."""
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.embedding_model,
                model_kwargs={'device': 'cpu'}  # Use CPU for compatibility
            )
            logger.info(f"Loaded embeddings model: {self.embedding_model}")
        except Exception as e:
            raise RuntimeError(f"Failed to load embeddings: {e}")
    
    def _get_llm(self) -> ChatGroq:
        """Get or create LLM instance with caching."""
        if self._llm is None:
            try:
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise ValueError("GROQ_API_KEY environment variable is required")
                
                self._llm = ChatGroq(
                    model=self.llm_model,
                    temperature=self.temperature,
                    groq_api_key=groq_api_key,
                    max_tokens=1024
                )
                logger.info(f"Initialized LLM: {self.llm_model}")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize LLM: {e}")
        return self._llm
    
    def _needs_rebuild(self) -> bool:
        """Check if vector store needs rebuilding based on source files."""
        try:
            if not os.path.exists(self.vectorstore_path + ".faiss"):
                logger.info("Vector store doesn't exist, needs building")
                return True
            
            if not os.path.exists(self.metadata_path):
                logger.info("Metadata file missing, rebuilding vector store")
                return True
            
            with open(self.metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Check if source directory is newer than last build
            if os.path.exists(self.data_dir):
                last_build = metadata.get('last_build_time', 0)
                dir_mtime = os.path.getmtime(self.data_dir)
                
                if dir_mtime > last_build:
                    logger.info("Source directory updated, rebuilding vector store")
                    return True
            
            return False
        except Exception as e:
            logger.warning(f"Error checking rebuild status: {e}")
            return True
    
    def _save_metadata(self, document_count: int) -> None:
        """Save metadata about the vector store build."""
        try:
            metadata = {
                'last_build_time': datetime.now().timestamp(),
                'document_count': document_count,
                'embedding_model': self.embedding_model,
                'chunk_size': self.chunk_size,
                'chunk_overlap': self.chunk_overlap
            }
            
            os.makedirs(os.path.dirname(self.metadata_path), exist_ok=True)
            with open(self.metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Failed to save metadata: {e}")
    
    def create_vector_store(self, force_rebuild: bool = False) -> None:
        """
        Create and save vector store from documents.
        
        Args:
            force_rebuild: Force rebuild even if not needed
        """
        try:
            if not force_rebuild and not self._needs_rebuild():
                logger.info("Vector store is up to date, skipping rebuild")
                return
            
            logger.info("Building vector store...")
            
            # Load documents
            if not os.path.exists(self.data_dir):
                raise FileNotFoundError(f"Data directory not found: {self.data_dir}")
            
            documents = DocumentLoader.load_documents(self.data_dir)
            if not documents:
                raise ValueError(f"No documents found in {self.data_dir}")
            
            logger.info(f"Loaded {len(documents)} documents")
            
            # Split documents
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            texts = splitter.split_documents(documents)
            logger.info(f"Created {len(texts)} text chunks")
            
            # Create vector store
            vectorstore = FAISS.from_documents(texts, embedding=self.embeddings)
            
            # Save vector store
            os.makedirs(os.path.dirname(self.vectorstore_path), exist_ok=True)
            vectorstore.save_local(self.vectorstore_path)
            
            # Save metadata
            self._save_metadata(len(texts))
            
            # Clear cached components
            self.vectorstore = None
            self._qa_chain = None
            
            logger.info(f"Vector store saved to {self.vectorstore_path}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to create vector store: {e}")
    
    def _load_vectorstore(self) -> FAISS:
        """Load vector store with caching."""
        if self.vectorstore is None:
            try:
                if not os.path.exists(self.vectorstore_path + ".faiss"):
                    logger.info("Vector store not found, creating new one...")
                    self.create_vector_store()
                
                self.vectorstore = FAISS.load_local(
                    self.vectorstore_path,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info("Vector store loaded successfully")
                
            except Exception as e:
                raise RuntimeError(f"Failed to load vector store: {e}")
        
        return self.vectorstore
    
    def _create_custom_prompt(self, language: str = 'vi') -> PromptTemplate:
        """Create custom prompt template for tourism Q&A based on language."""
        if language == 'en':
            template = """
            You are a smart travel assistant specializing in Quang Ninh Province, Vietnam. Your name is QBot.
            When asked in English, you MUST respond in English.
            You only answer questions related to travel such as: tourist destinations, itineraries, 
            hotels, restaurants, local cuisine, culture, history, transportation, weather, 
            travel costs, entertainment activities, etc.
            
            Your answers are STRICTLY limited to Quang Ninh Province (including Ha Long, Cam Pha, 
            Mong Cai, Dong Trieu, Quang Yen, etc.).
            
            If the question is not travel-related or is outside Quang Ninh Province, politely 
            decline and suggest asking about travel in Quang Ninh.
            
            Please respond in a friendly, enthusiastic manner and provide useful information.

            Relevant information:
            {context}

            Question: {question}

            Response guidelines:
            - Respond in English
            - Provide accurate and specific information
            - If no information is available in the documents, clearly state so
            - Give practical advice for travelers

            Answer:
            """
        else:
            template = """
            Bạn là một trợ lý du lịch thông minh của tỉnh Quảng Ninh, Việt Nam. Bạn tên là QBot.
            Khi được hỏi bằng tiếng Việt, bạn phải trả lời bằng tiếng Việt.
            Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm tham quan, lịch trình, 
            khách sạn, nhà hàng, ẩm thực địa phương, văn hóa, lịch sử, giao thông, thời tiết, 
            chi phí du lịch, hoạt động giải trí, v.v.
            
            Phạm vi trả lời của bạn CHỈ giới hạn trong các địa phương và các địa điểm du lịch tỉnh Quảng Ninh (bao gồm Hạ Long, Cẩm Phả, 
            Móng Cái, Đông Triều, Quảng Yên, v.v.).
            
            Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự 
            từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh, đặc biệt là không được tự ý bịa thông tin không chính xác, chỉ trả lời theo thông tin được cung cấp.
            
            Hãy trả lời một cách thân thiện, nhiệt tình và cung cấp thông tin hữu ích.

            Thông tin liên quan:
            {context}

            Câu hỏi: {question}

            Hướng dẫn trả lời:
            - Trả lời bằng tiếng Việt
            - Cung cấp thông tin chính xác và cụ thể
            - Nếu không có thông tin trong tài liệu, hãy thông báo rõ ràng
            - Đưa ra lời khuyên thực tế cho du khách
            - Không tự ý bịa thông tin

            Câu trả lời:
            """
        
        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
    
    def _get_friendly_error_message(self, language: str = 'vi') -> str:
        """Get a friendly error message instead of technical error."""
        if language == 'en':
            return ("I apologize, but I'm experiencing some technical difficulties at the moment. "
                   "Please try asking your question again in a few moments. "
                   "If the problem persists, please contact our support team.")
        else:
            return ("Xin lỗi, hiện tại tôi đang gặp một số vấn đề kỹ thuật. "
                   "Vui lòng thử hỏi lại câu hỏi sau vài phút. "
                   "Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ đội hỗ trợ của chúng tôi.")
    
    def _generate_fallback_response(self, query: str, language: str = 'vi') -> str:
        """Generate a fallback response when no specific information is found."""
        try:
            # Use LLM to generate a helpful response even without specific data
            llm = self._get_llm()
            
            if language == 'en':
                fallback_prompt = f"""
                You are QBot, a travel assistant for Quang Ninh Province, Vietnam.
                A user asked: "{query}"
                
                Even though you don't have specific information about this topic in your database,
                provide a helpful, general response about Quang Ninh tourism and suggest they:
                1. Contact local tourism offices
                2. Check official tourism websites
                3. Ask for more specific information
                
                Keep the response friendly and encouraging. Answer in English.
                """
            else:
                fallback_prompt = f"""
                Bạn là QBot, trợ lý du lịch của tỉnh Quảng Ninh, Việt Nam.
                Người dùng hỏi: "{query}"
                
                Mặc dù bạn không có thông tin cụ thể về chủ đề này trong cơ sở dữ liệu,
                hãy đưa ra phản hồi hữu ích, tổng quát về du lịch Quảng Ninh và gợi ý họ:
                1. Liên hệ văn phòng du lịch địa phương
                2. Kiểm tra các trang web du lịch chính thức
                3. Hỏi thông tin cụ thể hơn
                
                Giữ phản hồi thân thiện và khuyến khích. Trả lời bằng tiếng Việt.
                """
            
            response = llm.invoke(fallback_prompt)
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            logger.error(f"Error generating fallback response: {e}")
            if language == 'en':
                return ("I apologize, but I don't have specific information about that topic in my current database. "
                       "For the most accurate and up-to-date information about Quang Ninh tourism, "
                       "I recommend contacting local tourism offices or checking official tourism websites.")
            else:
                return ("Xin lỗi, tôi không có thông tin cụ thể về chủ đề đó trong cơ sở dữ liệu hiện tại. "
                       "Để có thông tin chính xác và cập nhật nhất về du lịch Quảng Ninh, "
                       "tôi khuyên bạn nên liên hệ với các văn phòng du lịch địa phương hoặc kiểm tra các trang web du lịch chính thức.")
    
    def _load_qa_chain(self, language: str = 'vi') -> RetrievalQA:
        """Load QA chain with caching and custom prompt for specific language."""
        try:
            vectorstore = self._load_vectorstore()
            retriever = vectorstore.as_retriever(
                search_kwargs={"k": 5}  # Return top 5 relevant chunks
            )
            
            llm = self._get_llm()
            custom_prompt = self._create_custom_prompt(language)
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": custom_prompt}
            )
            
            logger.info(f"QA chain loaded successfully for language: {language}")
            return qa_chain
            
        except Exception as e:
            raise RuntimeError(f"Failed to load QA chain: {e}")
    
    def ask_question(self, query: str, language: str = 'vi', return_sources: bool = False) -> str:
        """
        Ask a question and get response from RAG system.
        
        Args:
            query: User question
            language: Language for response ('vi' or 'en')
            return_sources: Whether to include source information
            
        Returns:
            Answer string or dict with sources if return_sources=True
        """
        if not query.strip():
            return "Vui lòng cung cấp câu hỏi hợp lệ." if language == 'vi' else "Please provide a valid question."
        
        try:
            chain = self._load_qa_chain(language)
            result = chain({"query": query})
            
            answer = result.get("result", "")
            
            # Check if answer is empty or indicates no information found
            if not answer or answer.strip() == "" or "không có thông tin" in answer.lower() or "no information" in answer.lower():
                fallback_answer = self._generate_fallback_response(query, language)
                if fallback_answer:
                    answer = fallback_answer
            
            if return_sources:
                sources = []
                for doc in result.get("source_documents", []):
                    sources.append({
                        "content": doc.page_content[:200] + "...",
                        "source": doc.metadata.get("source_file", "Unknown"),
                        "page": doc.metadata.get("page", "N/A")
                    })
                
                return {
                    "answer": answer,
                    "sources": sources
                }
            
            return answer
            
        except Exception as e:
            logger.error(f"Error processing question: {e}")
            # Return friendly error message instead of technical error
            return self._get_friendly_error_message(language)
    
    def ask_question_with_memory(self, 
                               query: str, 
                               conversation_memory,
                               language: str = 'vi', 
                               return_sources: bool = False) -> str:
        """
        Ask a question with conversation memory context.
        
        Args:
            query: User question
            conversation_memory: LangChain memory instance
            language: Language for response ('vi' or 'en')
            return_sources: Whether to include source information
            
        Returns:
            Answer string or dict with sources if return_sources=True
        """
        if not query.strip():
            return "Vui lòng cung cấp câu hỏi hợp lệ." if language == 'vi' else "Please provide a valid question."
        
        try:
            vectorstore = self._load_vectorstore()
            retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
            
            llm = self._get_llm()
            
            # Create conversational prompt template
            if language == 'en':
                template = """
                You are QBot, a smart travel assistant for Quang Ninh Province, Vietnam.
                Use the following context and conversation history to answer the question.
                
                Context from documents:
                {context}
                
                Chat History:
                {chat_history}
                
                Current Question: {question}
                
                Guidelines:
                - Answer in English
                - Focus on Quang Ninh Province tourism
                - Use conversation history for context
                - Be friendly and helpful
                
                Answer:
                """
            else:
                template = """
                Bạn là QBot, trợ lý du lịch thông minh của tỉnh Quảng Ninh, Việt Nam.
                Sử dụng thông tin từ tài liệu và lịch sử cuộc trò chuyện để trả lời câu hỏi.
                
                Thông tin từ tài liệu:
                {context}
                
                Lịch sử trò chuyện:
                {chat_history}
                
                Câu hỏi hiện tại: {question}
                
                Hướng dẫn:
                - Trả lời bằng tiếng Việt
                - Tập trung vào du lịch tỉnh Quảng Ninh
                - Sử dụng lịch sử trò chuyện để hiểu ngữ cảnh
                - Thân thiện và hữu ích
                
                Câu trả lời:
                """
            
            # Create conversational retrieval chain
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=retriever,
                memory=conversation_memory,
                return_source_documents=return_sources,
                verbose=False
            )
            
            # Get response
            result = qa_chain({"question": query})
            
            answer = result.get("answer", "")
            
            # Check if answer is empty or indicates no information found
            if not answer or answer.strip() == "" or "không có thông tin" in answer.lower() or "no information" in answer.lower():
                fallback_answer = self._generate_fallback_response(query, language)
                if fallback_answer:
                    answer = fallback_answer
            
            if return_sources:
                sources = []
                for doc in result.get("source_documents", []):
                    sources.append({
                        "content": doc.page_content[:200] + "...",
                        "source": doc.metadata.get("source_file", "Unknown"),
                        "page": doc.metadata.get("page", "N/A")
                    })
                
                return {
                    "answer": answer,
                    "sources": sources
                }
            
            return answer
            
        except Exception as e:
            logger.error(f"Error processing question with memory: {e}")
            # Return friendly error message instead of technical error
            return self._get_friendly_error_message(language)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG system."""
        try:
            stats = {
                "data_directory": self.data_dir,
                "vectorstore_path": self.vectorstore_path,
                "embedding_model": self.embedding_model,
                "llm_model": self.llm_model
            }
            
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r') as f:
                    metadata = json.load(f)
                stats.update(metadata)
            
            return stats
        except Exception as e:
            return {"error": str(e)}


# Global instance for backward compatibility
_rag_engine = None

def get_rag_engine() -> RAGEngine:
    """Get singleton RAG engine instance."""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine

# Backward compatibility functions
def create_vector_store():
    return get_rag_engine().create_vector_store()

def ask_question(query: str, language: str = 'vi') -> str:
    return get_rag_engine().ask_question(query, language)