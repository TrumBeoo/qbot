from flask import Blueprint, request, jsonify
from auth.auth import token_required
from services.mongodb_rag_service import mongodb_rag_service
from services.mongodb_chat_service import MongoDBChatService
import traceback

mongodb_bp = Blueprint('mongodb_chat', __name__)

@mongodb_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    """Create a new conversation"""
    try:
        data = request.get_json(force=True)
        title = (data or {}).get('title', 'New Conversation')
        metadata = (data or {}).get('metadata', {})
        metadata['language'] = (data or {}).get('language', 'vi')
        
        result = MongoDBChatService.create_conversation(
            current_user['id'], title, metadata
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': result["data"],
                'conversation_id': result["conversation_id"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error creating conversation: {str(e)}")
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """Get all conversations for user"""
    try:
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        result = MongoDBChatService.get_user_conversations(
            current_user['id'], limit, skip, include_messages=False
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': result["data"],
                'pagination': result["pagination"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error getting conversations: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/conversations/<conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """Get specific conversation with messages"""
    try:
        result = MongoDBChatService.get_conversation(
            conversation_id, current_user['id'], include_messages=True
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': result["data"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 404
            
    except Exception as e:
        print(f"Error getting conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/conversations/<conversation_id>', methods=['PUT'])
@token_required
def update_conversation(current_user, conversation_id):
    """Update conversation"""
    try:
        data = request.get_json(force=True)
        
        result = MongoDBChatService.update_conversation(
            conversation_id, current_user['id'], data
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'message': result["message"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 400
            
    except Exception as e:
        print(f"Error updating conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(current_user, conversation_id):
    """Delete conversation"""
    try:
        result = MongoDBChatService.delete_conversation(
            conversation_id, current_user['id']
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'message': result["message"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 404
            
    except Exception as e:
        print(f"Error deleting conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/chat', methods=['POST'])
@token_required
def chat_with_context(current_user):
    """Chat with MongoDB context and RAG"""
    try:
        data = request.get_json(force=True)
        message = (data or {}).get('message', '').strip()
        conversation_id = (data or {}).get('conversation_id')
        language = (data or {}).get('language')
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Message is required'}), 400
        
        result = mongodb_rag_service.chat_with_context(
            current_user['id'], message, conversation_id, language
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'response': result["response"],
                'language': result["language"],
                'conversation_id': result["conversation_id"],
                'metadata': result["metadata"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error in MongoDB chat: {str(e)}")
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/voice-chat', methods=['POST'])
@token_required
def voice_chat_with_context(current_user):
    """Voice chat with MongoDB context"""
    try:
        data = request.get_json(force=True)
        text = (data or {}).get('text', '').strip()
        conversation_id = (data or {}).get('conversation_id')
        language = (data or {}).get('language')
        
        if not text:
            return jsonify({'status': 'error', 'message': 'Text is required'}), 400
        
        result = mongodb_rag_service.voice_chat_with_context(
            current_user['id'], text, conversation_id, language
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'response': result["response"],
                'language': result["language"],
                'conversation_id': result["conversation_id"],
                'metadata': result["metadata"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error in MongoDB voice chat: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/search', methods=['GET'])
@token_required
def search_conversations(current_user):
    """Search conversations and messages"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Search query is required'}), 400
        
        result = MongoDBChatService.search_conversations(
            current_user['id'], query, limit
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': result["data"],
                'query': result["query"],
                'total_results': result["total_results"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error searching conversations: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    """Get analytics for user"""
    try:
        conversation_id = request.args.get('conversation_id')
        
        result = MongoDBChatService.get_analytics(
            current_user['id'], conversation_id
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': result["analytics"]
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error getting analytics: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mongodb_bp.route('/conversations/<conversation_id>/summary', methods=['GET'])
@token_required
def get_conversation_summary(current_user, conversation_id):
    """Get conversation summary"""
    try:
        language = request.args.get('language', 'vi')
        
        result = mongodb_rag_service.get_conversation_summary(
            conversation_id, current_user['id'], language
        )
        
        if result["success"]:
            return jsonify({
                'status': 'success',
                'data': {
                    'summary': result["summary"],
                    'message_count': result["message_count"],
                    'conversation_id': result["conversation_id"]
                }
            })
        else:
            return jsonify({'status': 'error', 'message': result["error"]}), 500
            
    except Exception as e:
        print(f"Error getting conversation summary: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500