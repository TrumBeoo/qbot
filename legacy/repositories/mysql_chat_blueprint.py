from flask import Blueprint, request, jsonify
from auth.auth import token_required
from services.mysql_chat_service import MySQLChatService
import traceback

mysql_chat_bp = Blueprint('mysql_chat', __name__)

@mysql_chat_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    """Create a new conversation"""
    try:
        data = request.get_json(force=True)
        title = (data or {}).get('title', 'New Conversation')
        user_message = (data or {}).get('user_message', '').strip()
        bot_response = (data or {}).get('bot_response', '').strip()
        language = (data or {}).get('language', 'vi')
        
        if user_message:
            # Create conversation with first message pair
            result = MySQLChatService.create_conversation_with_message(
                current_user['id'], user_message, bot_response, language
            )
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            # Create empty conversation
            conversation = MySQLChatService.create_conversation(current_user['id'], title)
            return jsonify({
                'status': 'success',
                'data': conversation
            })
    except Exception as e:
        print(f"Error creating conversation: {str(e)}")
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """Get all conversations for user"""
    try:
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        conversations = MySQLChatService.get_user_conversations(current_user['id'], limit, skip)
        
        return jsonify({
            'status': 'success',
            'data': conversations
        })
    except Exception as e:
        print(f"Error getting conversations: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations/<conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """Get specific conversation with messages"""
    try:
        conversation = MySQLChatService.get_conversation(conversation_id, current_user['id'])
        
        return jsonify({
            'status': 'success',
            'data': conversation
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 404
    except Exception as e:
        print(f"Error getting conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations/<conversation_id>', methods=['PUT'])
@token_required
def update_conversation(current_user, conversation_id):
    """Update conversation title"""
    try:
        data = request.get_json(force=True)
        title = (data or {}).get('title', '').strip()
        
        if not title:
            return jsonify({'status': 'error', 'message': 'Title is required'}), 400
        
        MySQLChatService.update_conversation_title(conversation_id, current_user['id'], title)
        
        return jsonify({
            'status': 'success',
            'message': 'Conversation updated successfully'
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
    except Exception as e:
        print(f"Error updating conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(current_user, conversation_id):
    """Delete conversation"""
    try:
        MySQLChatService.delete_conversation(conversation_id, current_user['id'])
        
        return jsonify({
            'status': 'success',
            'message': 'Conversation deleted successfully'
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 404
    except Exception as e:
        print(f"Error deleting conversation: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@token_required
def add_message(current_user, conversation_id):
    """Add message to conversation"""
    try:
        data = request.get_json(force=True)
        user_message = (data or {}).get('user_message', '').strip()
        bot_response = (data or {}).get('bot_response', '').strip()
        language = (data or {}).get('language', 'vi')
        
        if not user_message:
            return jsonify({'status': 'error', 'message': 'User message is required'}), 400
        
        messages = MySQLChatService.add_message_to_conversation(
            conversation_id, 
            current_user['id'], 
            user_message, 
            bot_response, 
            language
        )
        
        return jsonify({
            'status': 'success',
            'data': messages
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
    except Exception as e:
        print(f"Error adding message: {str(e)}")
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/conversations/<conversation_id>/messages/<message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, conversation_id, message_id):
    """Delete specific message"""
    try:
        MySQLChatService.delete_message(conversation_id, current_user['id'], message_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Message deleted successfully'
        })
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 404
    except Exception as e:
        print(f"Error deleting message: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/search', methods=['GET'])
@token_required
def search_conversations(current_user):
    """Search conversations and messages"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Search query is required'}), 400
        
        results = MySQLChatService.search_conversations(current_user['id'], query, limit)
        
        return jsonify({
            'status': 'success',
            'data': results,
            'query': query
        })
    except Exception as e:
        print(f"Error searching conversations: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/export', methods=['GET'])
@token_required
def export_conversations(current_user):
    """Export all conversations for user"""
    try:
        export_data = MySQLChatService.export_user_conversations(current_user['id'])
        
        return jsonify({
            'status': 'success',
            'data': export_data
        })
    except Exception as e:
        print(f"Error exporting conversations: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mysql_chat_bp.route('/stats', methods=['GET'])
@token_required
def get_conversation_stats(current_user):
    """Get conversation statistics"""
    try:
        stats = MySQLChatService.get_conversation_stats(current_user['id'])
        
        return jsonify({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        print(f"Error getting conversation stats: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

