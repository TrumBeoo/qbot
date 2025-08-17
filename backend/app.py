from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os
from rag_engine import ask_question
from noi import detect_language, get_ai_response, synthesize_speech_to_bytes

from auth import auth_bp, token_required
from chat_history import chat_bp
from db import chat_collection
from bson import ObjectId
from datetime import datetime
import pytz

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set JWT secret key
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')


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
                if ObjectId.is_valid(conversation_id):
                    # Check if conversation exists and belongs to user
                    conversation = chat_collection.find_one({
                        '_id': ObjectId(conversation_id),
                        'user_id': ObjectId(current_user_id)
                    })
                    
                    if conversation:
                        # Add messages to existing conversation
                        timestamp = datetime.utcnow()
                        
                        user_msg = {
                            '_id': ObjectId(),
                            'text': message,
                            'sender': 'user',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        bot_msg = {
                            '_id': ObjectId(),
                            'text': response_text,
                            'sender': 'bot',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        chat_collection.update_one(
                            {'_id': ObjectId(conversation_id)},
                            {
                                '$push': {'messages': {'$each': [user_msg, bot_msg]}},
                                '$set': {'updated_at': timestamp}
                            }
                        )
            except Exception as e:
                print(f"Error saving to chat history: {str(e)}")
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
                if ObjectId.is_valid(conversation_id):
                    conversation = chat_collection.find_one({
                        '_id': ObjectId(conversation_id),
                        'user_id': ObjectId(current_user_id)
                    })
                    
                    if conversation:
                        timestamp = datetime.utcnow()
                        
                        user_msg = {
                            '_id': ObjectId(),
                            'text': text,
                            'sender': 'user',
                            'timestamp': timestamp,
                            'language': detected_lang
                        }
                        
                        bot_msg = {
                            '_id': ObjectId(),
                            'text': response_text,
                            'sender': 'bot',
                            'timestamp': timestamp,
                            'language': detected_lang
                        }
                        
                        chat_collection.update_one(
                            {'_id': ObjectId(conversation_id)},
                            {
                                '$push': {'messages': {'$each': [user_msg, bot_msg]}},
                                '$set': {'updated_at': timestamp}
                            }
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

# Thêm vào cuối file app.py, trước if __name__ == '__main__':

@app.route('/rag-stats', methods=['GET'])
def get_rag_stats():
    """Get RAG system statistics"""
    try:
        from rag_engine import get_rag_engine
        stats = get_rag_engine().get_stats()
        return jsonify({
            'status': 'success',
            'stats': stats
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/rebuild-vectorstore', methods=['POST'])
@token_required  # Chỉ admin mới có thể rebuild
def rebuild_vectorstore(current_user_id):
    """Rebuild vector store (admin only)"""
    try:
        from rag_engine import get_rag_engine
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
        
        from rag_engine import get_rag_engine
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