from MongoDB.db import chat_collection, db
from datetime import datetime
from bson import ObjectId
import json
import numpy as np
from typing import List, Dict, Optional, Any

class MongoDBChatService:
    """
    MongoDB Chat Service - Chuyên phục vụ chatbot
    Quản lý chat_history collection với document-based structure
    Mỗi document = 1 conversation với đầy đủ messages, metadata, embedding
    """
    
    @staticmethod
    def create_conversation(user_id: str, title: str = "New Conversation", 
                          metadata: Dict = None) -> Dict:
        """
        Tạo conversation mới trong MongoDB
        
        Args:
            user_id: ID của user
            title: Tiêu đề conversation
            metadata: Metadata bổ sung (language, device_info, etc.)
            
        Returns:
            Dict chứa thông tin conversation đã tạo
        """
        try:
            conversation_doc = {
                "user_id": str(user_id),
                "title": title.strip() if title else "New Conversation",
                "messages": [],
                "context_vector": [],  # Embedding vector cho context
                "session_state": {
                    "active": True,
                    "last_activity": datetime.utcnow(),
                    "message_count": 0,
                    "language": metadata.get("language", "vi") if metadata else "vi"
                },
                "metadata": {
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "device_info": metadata.get("device_info") if metadata else None,
                    "user_agent": metadata.get("user_agent") if metadata else None,
                    "ip_address": metadata.get("ip_address") if metadata else None,
                    "tags": metadata.get("tags", []) if metadata else []
                },
                "analytics": {
                    "total_user_messages": 0,
                    "total_bot_messages": 0,
                    "avg_response_time": 0,
                    "user_satisfaction": None,
                    "topics": []
                }
            }
            
            result = chat_collection.insert_one(conversation_doc)
            conversation_doc["_id"] = str(result.inserted_id)
            conversation_doc["conversation_id"] = str(result.inserted_id)
            
            return {
                "success": True,
                "conversation_id": str(result.inserted_id),
                "data": MongoDBChatService._serialize_conversation(conversation_doc)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error creating conversation: {str(e)}"
            }
    
    @staticmethod
    def add_message(conversation_id: str, user_id: str, role: str, 
                   content: str, metadata: Dict = None) -> Dict:
        """
        Thêm message vào conversation
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            role: 'user' hoặc 'bot'
            content: Nội dung message
            metadata: Metadata bổ sung (response_time, confidence, etc.)
            
        Returns:
            Dict chứa thông tin message đã thêm
        """
        try:
            # Tạo message object
            message = {
                "message_id": str(ObjectId()),
                "role": role,
                "content": content.strip(),
                "timestamp": datetime.utcnow(),
                "metadata": {
                    "language": metadata.get("language", "vi") if metadata else "vi",
                    "response_time": metadata.get("response_time") if metadata else None,
                    "confidence": metadata.get("confidence") if metadata else None,
                    "tokens_used": metadata.get("tokens_used") if metadata else None,
                    "model_version": metadata.get("model_version") if metadata else None,
                    "rag_sources": metadata.get("rag_sources", []) if metadata else []
                }
            }
            
            # Update conversation
            update_data = {
                "$push": {"messages": message},
                "$set": {
                    "session_state.last_activity": datetime.utcnow(),
                    "metadata.updated_at": datetime.utcnow()
                },
                "$inc": {
                    "session_state.message_count": 1,
                    f"analytics.total_{role}_messages": 1
                }
            }
            
            # Cập nhật context vector nếu có
            if metadata and "context_vector" in metadata:
                update_data["$set"]["context_vector"] = metadata["context_vector"]
            
            result = chat_collection.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": str(user_id)
                },
                update_data
            )
            
            if result.matched_count == 0:
                return {
                    "success": False,
                    "error": "Conversation not found or access denied"
                }
            
            return {
                "success": True,
                "message": MongoDBChatService._serialize_message(message)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error adding message: {str(e)}"
            }
    
    @staticmethod
    def get_conversation(conversation_id: str, user_id: str, 
                        include_messages: bool = True) -> Dict:
        """
        Lấy conversation theo ID
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            include_messages: Có bao gồm messages không
            
        Returns:
            Dict chứa thông tin conversation
        """
        try:
            # Projection để tối ưu query
            projection = None
            if not include_messages:
                projection = {"messages": 0}
            
            conversation = chat_collection.find_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": str(user_id)
                },
                projection
            )
            
            if not conversation:
                return {
                    "success": False,
                    "error": "Conversation not found"
                }
            
            return {
                "success": True,
                "data": MongoDBChatService._serialize_conversation(conversation)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting conversation: {str(e)}"
            }
    
    @staticmethod
    def get_user_conversations(user_id: str, limit: int = 50, 
                             skip: int = 0, include_messages: bool = False) -> Dict:
        """
        Lấy danh sách conversations của user
        
        Args:
            user_id: ID của user
            limit: Số lượng conversations tối đa
            skip: Số lượng conversations bỏ qua
            include_messages: Có bao gồm messages không
            
        Returns:
            Dict chứa danh sách conversations
        """
        try:
            # Projection để tối ưu query
            projection = None
            if not include_messages:
                projection = {"messages": 0}
            
            conversations = list(chat_collection.find(
                {"user_id": str(user_id)},
                projection
            ).sort("metadata.updated_at", -1).skip(skip).limit(limit))
            
            # Đếm tổng số conversations
            total_count = chat_collection.count_documents({"user_id": str(user_id)})
            
            return {
                "success": True,
                "data": [MongoDBChatService._serialize_conversation(conv) for conv in conversations],
                "pagination": {
                    "total": total_count,
                    "limit": limit,
                    "skip": skip,
                    "has_more": (skip + limit) < total_count
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting user conversations: {str(e)}"
            }
    
    @staticmethod
    def update_conversation(conversation_id: str, user_id: str, 
                          updates: Dict) -> Dict:
        """
        Cập nhật conversation
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            updates: Dict chứa các field cần update
            
        Returns:
            Dict chứa kết quả update
        """
        try:
            # Chuẩn bị update data
            update_data = {"$set": {"metadata.updated_at": datetime.utcnow()}}
            
            # Các field được phép update
            allowed_fields = ["title", "metadata.tags", "session_state.language"]
            
            for field, value in updates.items():
                if field in allowed_fields:
                    update_data["$set"][field] = value
            
            result = chat_collection.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": str(user_id)
                },
                update_data
            )
            
            if result.matched_count == 0:
                return {
                    "success": False,
                    "error": "Conversation not found or access denied"
                }
            
            return {
                "success": True,
                "message": "Conversation updated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error updating conversation: {str(e)}"
            }
    
    @staticmethod
    def delete_conversation(conversation_id: str, user_id: str) -> Dict:
        """
        Xóa conversation
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            
        Returns:
            Dict chứa kết quả xóa
        """
        try:
            result = chat_collection.delete_one({
                "_id": ObjectId(conversation_id),
                "user_id": str(user_id)
            })
            
            if result.deleted_count == 0:
                return {
                    "success": False,
                    "error": "Conversation not found or access denied"
                }
            
            return {
                "success": True,
                "message": "Conversation deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error deleting conversation: {str(e)}"
            }
    
    @staticmethod
    def search_conversations(user_id: str, query: str, limit: int = 20) -> Dict:
        """
        Tìm kiếm conversations và messages
        
        Args:
            user_id: ID của user
            query: Từ khóa tìm kiếm
            limit: Số lượng kết quả tối đa
            
        Returns:
            Dict chứa kết quả tìm kiếm
        """
        try:
            # MongoDB text search
            search_pipeline = [
                {
                    "$match": {
                        "user_id": str(user_id),
                        "$or": [
                            {"title": {"$regex": query, "$options": "i"}},
                            {"messages.content": {"$regex": query, "$options": "i"}}
                        ]
                    }
                },
                {
                    "$addFields": {
                        "matching_messages": {
                            "$filter": {
                                "input": "$messages",
                                "cond": {
                                    "$regexMatch": {
                                        "input": "$$this.content",
                                        "regex": query,
                                        "options": "i"
                                    }
                                }
                            }
                        }
                    }
                },
                {"$limit": limit},
                {"$sort": {"metadata.updated_at": -1}}
            ]
            
            results = list(chat_collection.aggregate(search_pipeline))
            
            return {
                "success": True,
                "data": [MongoDBChatService._serialize_conversation(conv) for conv in results],
                "query": query,
                "total_results": len(results)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error searching conversations: {str(e)}"
            }
    
    @staticmethod
    def get_conversation_context(conversation_id: str, user_id: str, 
                               last_n_messages: int = 10) -> Dict:
        """
        Lấy context của conversation cho chatbot (RAG)
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            last_n_messages: Số lượng messages gần nhất
            
        Returns:
            Dict chứa context cho chatbot
        """
        try:
            conversation = chat_collection.find_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": str(user_id)
                },
                {
                    "messages": {"$slice": -last_n_messages},
                    "context_vector": 1,
                    "session_state": 1,
                    "metadata": 1
                }
            )
            
            if not conversation:
                return {
                    "success": False,
                    "error": "Conversation not found"
                }
            
            # Chuẩn bị context cho chatbot
            context = {
                "conversation_id": str(conversation["_id"]),
                "user_id": user_id,
                "language": conversation.get("session_state", {}).get("language", "vi"),
                "recent_messages": [
                    {
                        "role": msg["role"],
                        "content": msg["content"],
                        "timestamp": msg["timestamp"].isoformat()
                    }
                    for msg in conversation.get("messages", [])
                ],
                "context_vector": conversation.get("context_vector", []),
                "session_active": conversation.get("session_state", {}).get("active", True),
                "last_activity": conversation.get("session_state", {}).get("last_activity")
            }
            
            if context["last_activity"]:
                context["last_activity"] = context["last_activity"].isoformat()
            
            return {
                "success": True,
                "context": context
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting conversation context: {str(e)}"
            }
    
    @staticmethod
    def update_context_vector(conversation_id: str, user_id: str, 
                            context_vector: List[float]) -> Dict:
        """
        Cập nhật context vector cho conversation (embedding)
        
        Args:
            conversation_id: ID của conversation
            user_id: ID của user
            context_vector: Vector embedding
            
        Returns:
            Dict chứa kết quả update
        """
        try:
            result = chat_collection.update_one(
                {
                    "_id": ObjectId(conversation_id),
                    "user_id": str(user_id)
                },
                {
                    "$set": {
                        "context_vector": context_vector,
                        "metadata.updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count == 0:
                return {
                    "success": False,
                    "error": "Conversation not found or access denied"
                }
            
            return {
                "success": True,
                "message": "Context vector updated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error updating context vector: {str(e)}"
            }
    
    @staticmethod
    def get_analytics(user_id: str, conversation_id: str = None) -> Dict:
        """
        Lấy analytics cho user hoặc conversation cụ thể
        
        Args:
            user_id: ID của user
            conversation_id: ID của conversation (optional)
            
        Returns:
            Dict chứa analytics data
        """
        try:
            if conversation_id:
                # Analytics cho conversation cụ thể
                conversation = chat_collection.find_one(
                    {
                        "_id": ObjectId(conversation_id),
                        "user_id": str(user_id)
                    },
                    {"analytics": 1, "session_state": 1, "messages": 1}
                )
                
                if not conversation:
                    return {
                        "success": False,
                        "error": "Conversation not found"
                    }
                
                analytics = conversation.get("analytics", {})
                analytics["message_count"] = len(conversation.get("messages", []))
                
                return {
                    "success": True,
                    "analytics": analytics
                }
            else:
                # Analytics tổng hợp cho user
                pipeline = [
                    {"$match": {"user_id": str(user_id)}},
                    {
                        "$group": {
                            "_id": None,
                            "total_conversations": {"$sum": 1},
                            "total_messages": {"$sum": "$session_state.message_count"},
                            "total_user_messages": {"$sum": "$analytics.total_user_messages"},
                            "total_bot_messages": {"$sum": "$analytics.total_bot_messages"},
                            "avg_messages_per_conversation": {"$avg": "$session_state.message_count"}
                        }
                    }
                ]
                
                result = list(chat_collection.aggregate(pipeline))
                
                if not result:
                    return {
                        "success": True,
                        "analytics": {
                            "total_conversations": 0,
                            "total_messages": 0,
                            "total_user_messages": 0,
                            "total_bot_messages": 0,
                            "avg_messages_per_conversation": 0
                        }
                    }
                
                analytics = result[0]
                del analytics["_id"]
                
                return {
                    "success": True,
                    "analytics": analytics
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting analytics: {str(e)}"
            }
    
    @staticmethod
    def _serialize_conversation(conversation: Dict) -> Dict:
        """
        Serialize conversation document để trả về JSON
        
        Args:
            conversation: Conversation document từ MongoDB
            
        Returns:
            Dict đã serialize
        """
        if "_id" in conversation:
            conversation["conversation_id"] = str(conversation["_id"])
            conversation["id"] = str(conversation["_id"])  # Thêm id field cho compatibility
            del conversation["_id"]
        
        # Serialize messages
        if "messages" in conversation and isinstance(conversation["messages"], list):
            conversation["messages"] = [
                MongoDBChatService._serialize_message(msg) for msg in conversation["messages"]
            ]
        
        # Serialize datetime objects
        for key, value in conversation.items():
            if isinstance(value, datetime):
                conversation[key] = value.isoformat()
            elif isinstance(value, dict) and key != "messages":
                conversation[key] = MongoDBChatService._serialize_dict(value)
        
        return conversation
    
    @staticmethod
    def _serialize_message(message: Dict) -> Dict:
        """
        Serialize message object
        
        Args:
            message: Message object
            
        Returns:
            Dict đã serialize
        """
        # Thêm id field cho compatibility
        if "message_id" in message:
            message["id"] = message["message_id"]
        
        # Thêm sender field cho compatibility
        if "role" in message:
            message["sender"] = message["role"]
        
        # Thêm text field cho compatibility
        if "content" in message:
            message["text"] = message["content"]
        
        if "timestamp" in message and isinstance(message["timestamp"], datetime):
            message["timestamp"] = message["timestamp"].isoformat()
        
        if "metadata" in message:
            message["metadata"] = MongoDBChatService._serialize_dict(message["metadata"])
            # Thêm language field ở top level cho compatibility
            if "language" in message["metadata"]:
                message["language"] = message["metadata"]["language"]
        
        return message
    
    @staticmethod
    def _serialize_dict(data: Dict) -> Dict:
        """
        Serialize dictionary với datetime objects
        
        Args:
            data: Dictionary cần serialize
            
        Returns:
            Dict đã serialize
        """
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = MongoDBChatService._serialize_dict(value)
        
        return data