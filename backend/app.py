from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os
from RAG.rag_engine import ask_question
from config.noi import detect_language, get_ai_response, synthesize_speech_to_bytes

from auth.auth import auth_bp, token_required
from repositories.chat_history import chat_bp
from services.chat_service import ChatService
from datetime import datetime
import pytz

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set JWT secret key
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')

# Initialize database indexes for better performance
try:
    from db import users_collection, chat_collection, db
    # Create indexes for better query performance
    users_collection.create_index('email', unique=True)
    users_collection.create_index('google_id')
    users_collection.create_index('facebook_id')
    chat_collection.create_index([('user_id', 1), ('updated_at', -1)])
    chat_collection.create_index([('user_id', 1), ('title', 'text'), ('messages.text', 'text')])
    

except Exception as e:
    print(f"Warning: Could not create database indexes: {e}")


# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Chat and Voice API running'
    })

def get_current_datetime():
    """Helper function to get current datetime info"""
    vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
    now = datetime.now(vn_tz)
    return {
        'datetime': now.strftime('%d/%m/%Y %H:%M:%S'),
        'date': now.strftime('%d/%m/%Y'),
        'time': now.strftime('%H:%M:%S'),
        'full': now.strftime('%A, %d %B %Y, %H:%M:%S')
    }

@app.route('/datetime', methods=['GET'])
def get_datetime():
    return jsonify({
        'status': 'success',
        **get_current_datetime()
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Public chat endpoint (no authentication required)"""
    try:
        data = request.get_json(force=True)
        message = (data or {}).get('message', '').strip()
        lang = (data or {}).get('language')
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Missing message'}), 400
        
        if not lang:
            lang = detect_language(message)
        
        # Check if user is asking about time/date
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in message.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{message}. Hiện tại là {datetime_info['datetime']}", lang)
        else:
            # Use RAG for tourism queries with language support
            response_text = ask_question(message, lang)
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/chat-authenticated', methods=['POST'])
@token_required
def chat_authenticated(current_user_id):
    """Authenticated chat endpoint that saves to history"""
    try:
        data = request.get_json(force=True)
        message = (data or {}).get('message', '').strip()
        lang = (data or {}).get('language')
        conversation_id = (data or {}).get('conversation_id')
        
        print(f"🔍 Received authenticated request: message='{message}', lang='{lang}', conversation_id='{conversation_id}'")
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Missing message'}), 400
        
        if not lang:
            lang = detect_language(message)
        
        # Check if user is asking about time/date
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in message.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{message}. Hiện tại là {datetime_info['datetime']}", lang)
        else:
            # Use RAG for tourism queries with language support
            response_text = ask_question(message, lang)
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                print(f"💾 Saving to conversation {conversation_id}: user='{message}', bot='{response_text[:50]}...'")
                result = ChatService.add_message_to_conversation(
                    conversation_id, 
                    current_user_id, 
                    message, 
                    response_text, 
                    lang
                )
                print(f"✅ Messages saved successfully: {len(result)} messages")
            except Exception as e:
                print(f"❌ Error saving to chat history: {str(e)}")
                import traceback
                traceback.print_exc()
                # Continue even if saving fails
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    """Public voice chat endpoint (no authentication required)"""
    try:
        data = request.get_json(force=True)
        text = (data or {}).get('text', '').strip()
        lang = (data or {}).get('language')  # Optional language hint from frontend
        
        if not text:
            return jsonify({'status': 'error', 'message': 'Missing text'}), 400
        
        # Always detect language from the actual text
        detected_lang = detect_language(text)
        print(f"Voice Chat - Input: '{text}' | Detected: {detected_lang} | Hint: {lang}")
        
        # Always use AI response with proper language handling
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in text.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{text}. Hiện tại là {datetime_info['datetime']}", detected_lang)
        else:
            response_text = get_ai_response(text, detected_lang)
        
        # Generate audio in the same language as the response
        audio_bytes = synthesize_speech_to_bytes(response_text, detected_lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        return jsonify({
            'status': 'success',
            'response': response_text,
            'language': detected_lang,  # Return the actually detected language
            'audio': audio_b64
        })
    except Exception as e:
        print(f"Voice chat error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/voice-chat-authenticated', methods=['POST'])
@token_required
def voice_chat_authenticated(current_user_id):
    """Authenticated voice chat endpoint that saves to history"""
    try:
        data = request.get_json(force=True)
        text = (data or {}).get('text', '').strip()
        lang = (data or {}).get('language')  # Optional language hint from frontend
        conversation_id = (data or {}).get('conversation_id')
        
        if not text:
            return jsonify({'status': 'error', 'message': 'Missing text'}), 400
        
        # Always detect language from the actual text
        detected_lang = detect_language(text)
        print(f"Authenticated Voice Chat - Input: '{text}' | Detected: {detected_lang} | Hint: {lang}")
        
        # Always use AI response with proper language handling
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in text.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{text}. Hiện tại là {datetime_info['datetime']}", detected_lang)
        else:
            response_text = get_ai_response(text, detected_lang)
        
        # Generate audio in the same language as the response
        audio_bytes = synthesize_speech_to_bytes(response_text, detected_lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                ChatService.add_message_to_conversation(
                    conversation_id, 
                    current_user_id, 
                    text, 
                    response_text, 
                    detected_lang
                )
            except Exception as e:
                print(f"Error saving to chat history: {str(e)}")
        
        return jsonify({
            'status': 'success',
            'response': response_text,
            'language': detected_lang,  # Return the actually detected language
            'audio': audio_b64
        })
    except Exception as e:
        print(f"Authenticated voice chat error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Dashboard API endpoints for chatbot management

@app.route('/api/dashboard/chatbot-stats', methods=['GET'])
@token_required
def get_chatbot_stats(current_user_id):
    """Get comprehensive chatbot statistics for dashboard"""
    try:
        from services.chatbot_service import ChatbotService
        stats = ChatbotService.get_chatbot_stats()
        return jsonify({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-sources', methods=['GET'])
@token_required
def get_data_sources(current_user_id):
    """Get list of data sources"""
    try:
        from services.chatbot_service import ChatbotService
        sources = ChatbotService.get_data_sources()
        return jsonify({
            'status': 'success',
            'data': sources
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-sources', methods=['POST'])
@token_required
def add_data_source(current_user_id):
    """Add new data source file"""
    try:
        data = request.get_json(force=True)
        filename = (data or {}).get('filename', '').strip()
        content = (data or {}).get('content', '').strip()
        
        if not filename or not content:
            return jsonify({'status': 'error', 'message': 'Missing filename or content'}), 400
        
        from services.chatbot_service import ChatbotService
        result = ChatbotService.add_data_source(filename, content)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-sources/<filename>', methods=['GET'])
@token_required
def get_file_content(current_user_id, filename):
    """Get content of a specific data source file"""
    try:
        from services.chatbot_service import ChatbotService
        result = ChatbotService.get_file_content(filename)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 404
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-sources/<filename>', methods=['PUT'])
@token_required
def update_data_source(current_user_id, filename):
    """Update existing data source file"""
    try:
        data = request.get_json(force=True)
        content = (data or {}).get('content', '').strip()
        
        if not content:
            return jsonify({'status': 'error', 'message': 'Missing content'}), 400
        
        from services.chatbot_service import ChatbotService
        result = ChatbotService.update_data_source(filename, content)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-sources/<filename>', methods=['DELETE'])
@token_required
def delete_data_source(current_user_id, filename):
    """Delete data source file"""
    try:
        from services.chatbot_service import ChatbotService
        result = ChatbotService.delete_data_source(filename)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/chatbot-test', methods=['POST'])
@token_required
def test_chatbot(current_user_id):
    """Test chatbot with a query"""
    try:
        data = request.get_json(force=True)
        query = (data or {}).get('query', '').strip()
        language = (data or {}).get('language', 'vi')
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Missing query'}), 400
        
        from services.chatbot_service import ChatbotService
        result = ChatbotService.test_chatbot(query, language)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/rebuild-vectorstore', methods=['POST'])
@token_required
def rebuild_vectorstore_dashboard(current_user_id):
    """Rebuild vector store for dashboard"""
    try:
        from services.chatbot_service import ChatbotService
        result = ChatbotService.rebuild_vectorstore()
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Legacy endpoints (keep for backward compatibility)

@app.route('/rag-stats', methods=['GET'])
def get_rag_stats():
    """Get RAG system statistics"""
    try:
        from RAG.rag_engine import get_rag_engine
        stats = get_rag_engine().get_stats()
        return jsonify({
            'status': 'success',
            'stats': stats
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/rebuild-vectorstore', methods=['POST'])
@token_required
def rebuild_vectorstore(current_user_id):
    """Rebuild vector store"""
    try:
        from RAG.rag_engine import get_rag_engine
        get_rag_engine().create_vector_store(force_rebuild=True)
        return jsonify({
            'status': 'success',
            'message': 'Vector store rebuilt successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/search-similar', methods=['POST'])
def search_similar():
    """Search for similar documents without full QA"""
    try:
        data = request.get_json(force=True)
        query = (data or {}).get('query', '').strip()
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Missing query'}), 400
        
        from RAG.rag_engine import get_rag_engine
        rag = get_rag_engine()
        vectorstore = rag._load_vectorstore()
        
        # Search for similar documents
        docs = vectorstore.similarity_search(query, k=5)
        
        results = []
        for doc in docs:
            results.append({
                'content': doc.page_content[:300] + "...",
                'source': doc.metadata.get('source_file', 'Unknown'),
                'score': getattr(doc, 'score', None)
            })
        
        return jsonify({
            'status': 'success',
            'results': results,
            'query': query
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print('🚀 Chat API is ready on http://0.0.0.0:5000')
    print('🔐 Authentication endpoints available at /api/auth/*')
    print('💬 Chat history endpoints available at /api/chat/*')
    app.run(host='0.0.0.0', port=5000, debug=True)