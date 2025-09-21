from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os
from RAG.rag_engine import ask_question
from config.noi import detect_language, get_ai_response, synthesize_speech_to_bytes
from services.location_image_service import location_image_service

from auth.auth import auth_bp, token_required
from services.mysql_chat_service import MySQLChatService
from datetime import datetime
import pytz

load_dotenv()

app = Flask(__name__)
CORS(app, 
     origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3333'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Initialize location image service
location_service = location_image_service

def get_response_with_images(message, lang):
    """Get chatbot response with location images if applicable"""
    # Get text response
    response_text = ask_question(message, lang)
    
    # Extract location keywords and get images
    location_keywords = location_service.extract_location_keywords(message)
    images = []
    
    if location_keywords:
        images = location_service.get_images_by_location(location_keywords, limit=4)
        print(f"Found {len(images)} images for keywords: {location_keywords}")
    
    return response_text, images

# Set JWT secret key
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-k ey-change-this-in-production')

# Initialize database indexes for better performance
try:
    from MongoDB.db import users_collection, admin_user_collection, db
    # Create indexes for better query performance
    users_collection.create_index('email', unique=True)
    users_collection.create_index('google_id')
    users_collection.create_index('facebook_id')
    
    # Initialize MySQL database
    from MySQL.setup_mysql import create_database_and_tables
    create_database_and_tables()
    print("✅ MySQL database initialized successfully")
    
except Exception as e:
    print(f"Warning: Could not initialize databases: {e}")


# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Register MySQL chat blueprint
from repositories.mysql_chat_blueprint import mysql_chat_bp
app.register_blueprint(mysql_chat_bp, url_prefix='/api/chat')



@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Chat and Voice API running'
    })

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (images)"""
    return send_from_directory('static', filename)

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
            images = []
        else:
            # Use RAG for tourism queries with language support and get images
            response_text, images = get_response_with_images(message, lang)
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang,
            'images': images
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
            images = []
        else:
            # Use RAG for tourism queries with language support and get images
            response_text, images = get_response_with_images(message, lang)
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                print(f"💾 Saving to MySQL conversation {conversation_id}: user='{message}', bot='{response_text[:50]}...'")
                result = MySQLChatService.add_message_to_conversation(
                    conversation_id, 
                    current_user_id, 
                    message, 
                    response_text, 
                    lang
                )
                print(f"✅ Messages saved successfully to MySQL: {len(result)} messages")
            except Exception as e:
                print(f"❌ Error saving to MySQL chat history: {str(e)}")
                import traceback
                traceback.print_exc()
                # Continue even if saving fails
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang,
            'images': images
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
        
        # Check if user is asking about time/date
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in text.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{text}. Hiện tại là {datetime_info['datetime']}", detected_lang)
        else:
            # Use RAG for tourism queries with language support (same as chat endpoint)
            response_text = ask_question(text, detected_lang)
        
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

@app.route('/voice-welcome', methods=['POST'])
def voice_welcome():
    """Generate welcome message for voice mode"""
    try:
        data = request.get_json(force=True)
        lang = (data or {}).get('language', 'vi')
        
        # Welcome messages
        if lang == 'en':
            welcome_text = "Hello! I am your travel assistant. You can ask me about destinations, itineraries, hotels, food, and more travel information!"
        else:
            welcome_text = "Xin chào! Tôi là trợ lý du lịch của bạn. Bạn có thể hỏi tôi về địa điểm, lịch trình, khách sạn, ẩm thực và nhiều thông tin du lịch khác!"
        
        # Generate audio
        audio_bytes = synthesize_speech_to_bytes(welcome_text, lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        return jsonify({
            'status': 'success',
            'response': welcome_text,
            'language': lang,
            'audio': audio_b64
        })
    except Exception as e:
        print(f"Voice welcome error: {str(e)}")
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
        
        # Check if user is asking about time/date
        time_keywords = ['giờ', 'ngày', 'tháng', 'năm', 'time', 'date', 'today', 'now', 'hôm nay', 'bây giờ']
        if any(keyword in text.lower() for keyword in time_keywords):
            datetime_info = get_current_datetime()
            response_text = get_ai_response(f"{text}. Hiện tại là {datetime_info['datetime']}", detected_lang)
        else:
            # Use RAG for tourism queries with language support (same as chat endpoint)
            response_text = ask_question(text, detected_lang)
        
        # Generate audio in the same language as the response
        audio_bytes = synthesize_speech_to_bytes(response_text, detected_lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                MySQLChatService.add_message_to_conversation(
                    conversation_id, 
                    current_user_id, 
                    text, 
                    response_text, 
                    detected_lang
                )
            except Exception as e:
                print(f"Error saving to MySQL chat history: {str(e)}")
        
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

# Image management endpoints

@app.route('/api/dashboard/images/upload', methods=['POST'])
@token_required
def upload_image(current_user_id):
    """Upload image for chatbot"""
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image file provided'}), 400
        
        file = request.files['image']
        location_id = request.form.get('location_id')
        image_type = request.form.get('image_type', 'gallery')
        caption = request.form.get('caption', '')
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if not location_id:
            return jsonify({'status': 'error', 'message': 'Location ID required'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400
        
        # Create uploads directory if not exists
        upload_dir = os.path.join('static', 'images', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Save to database
        image_url = f"/static/images/uploads/{unique_filename}"
        success = location_service.add_location_image(
            location_id=int(location_id),
            image_url=image_url,
            image_type=image_type,
            caption=caption
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Image uploaded successfully',
                'image_url': f"http://localhost:5000{image_url}"
            })
        else:
            # Remove file if database save failed
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'status': 'error', 'message': 'Failed to save image to database'}), 500
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/locations', methods=['GET'])
@token_required
def get_locations(current_user_id):
    """Get all locations for dropdown"""
    try:
        connection = location_service.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT id, name, name_en, category FROM locations ORDER BY name")
        locations = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'status': 'success',
            'data': locations
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/images', methods=['GET'])
@token_required
def get_all_images(current_user_id):
    """Get all uploaded images with location info"""
    try:
        connection = location_service.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
        SELECT 
            li.id,
            li.image_url,
            li.image_type,
            li.caption,
            li.display_order,
            li.is_active,
            li.created_at,
            l.name as location_name,
            l.category
        FROM location_images li
        JOIN locations l ON li.location_id = l.id
        ORDER BY li.created_at DESC
        """
        
        cursor.execute(query)
        images = cursor.fetchall()
        
        # Format image URLs
        for image in images:
            if image['image_url'].startswith('/static/'):
                image['full_url'] = f"http://localhost:5000{image['image_url']}"
            else:
                image['full_url'] = image['image_url']
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'status': 'success',
            'data': images
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_image(current_user_id, image_id):
    """Delete an image"""
    try:
        connection = location_service.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get image info first
        cursor.execute("SELECT image_url FROM location_images WHERE id = %s", (image_id,))
        image = cursor.fetchone()
        
        if not image:
            return jsonify({'status': 'error', 'message': 'Image not found'}), 404
        
        # Delete from database
        cursor.execute("DELETE FROM location_images WHERE id = %s", (image_id,))
        connection.commit()
        
        # Delete file if it's a local upload
        if image['image_url'].startswith('/static/images/uploads/'):
            file_path = image['image_url'][1:]  # Remove leading slash
            if os.path.exists(file_path):
                os.remove(file_path)
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Image deleted successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# MongoDB Data Management endpoints

@app.route('/api/dashboard/mongodb/sync-status', methods=['GET'])
@token_required
def get_mongodb_sync_status(current_user_id):
    """Get MongoDB synchronization status"""
    try:
        from services.mongodb_data_service import MongoDBDataService
        status = MongoDBDataService.get_sync_status()
        return jsonify({
            'status': 'success',
            'data': status
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/mongodb/sync-all', methods=['POST'])
@token_required
def sync_all_to_mongodb(current_user_id):
    """Sync all data files to MongoDB"""
    try:
        from services.mongodb_data_service import MongoDBDataService
        result = MongoDBDataService.sync_all_files()
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 500
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/mongodb/force-resync', methods=['POST'])
@token_required
def force_resync_mongodb(current_user_id):
    """Force resync all data to MongoDB"""
    try:
        from services.mongodb_data_service import MongoDBDataService
        result = MongoDBDataService.force_resync()
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 500
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/mongodb/sync-file/<filename>', methods=['POST'])
@token_required
def sync_file_to_mongodb(current_user_id, filename):
    """Sync specific file to MongoDB"""
    try:
        from services.mongodb_data_service import MongoDBDataService
        result = MongoDBDataService.sync_file_to_mongodb(filename)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 500
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/mongodb/file/<filename>', methods=['GET'])
@token_required
def get_mongodb_file(current_user_id, filename):
    """Get file content from MongoDB"""
    try:
        from services.mongodb_data_service import MongoDBDataService
        result = MongoDBDataService.get_file_from_mongodb(filename)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 404
        
        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Data file management endpoints

@app.route('/api/dashboard/data-files', methods=['GET'])
@token_required
def get_data_files(current_user_id):
    """Get list of data files"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        files = []
        
        if os.path.exists(data_dir):
            for filename in os.listdir(data_dir):
                if filename.endswith('.txt'):
                    file_path = os.path.join(data_dir, filename)
                    stat = os.stat(file_path)
                    
                    files.append({
                        'name': filename,
                        'size': stat.st_size,
                        'modified': stat.st_mtime,
                        'path': file_path
                    })
        
        return jsonify({
            'status': 'success',
            'data': files
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-files/<filename>', methods=['GET'])
@token_required
def get_data_file_content(current_user_id, filename):
    """Get content of a data file"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        file_path = os.path.join(data_dir, filename)
        
        if not os.path.exists(file_path) or not filename.endswith('.txt'):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            'status': 'success',
            'data': {
                'filename': filename,
                'content': content,
                'size': len(content)
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-files', methods=['POST'])
@token_required
def create_data_file(current_user_id):
    """Create new data file"""
    try:
        data = request.get_json(force=True)
        filename = (data or {}).get('filename', '').strip()
        content = (data or {}).get('content', '').strip()
        
        if not filename or not content:
            return jsonify({'status': 'error', 'message': 'Filename and content required'}), 400
        
        if not filename.endswith('.txt'):
            filename += '.txt'
        
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        file_path = os.path.join(data_dir, filename)
        
        if os.path.exists(file_path):
            return jsonify({'status': 'error', 'message': 'File already exists'}), 400
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Rebuild vectorstore after adding new data
        try:
            from RAG.rag_engine import get_rag_engine
            get_rag_engine().create_vector_store(force_rebuild=True)
        except Exception as e:
            print(f"Warning: Could not rebuild vectorstore: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'File created successfully',
            'filename': filename
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-files/<filename>', methods=['PUT'])
@token_required
def update_data_file(current_user_id, filename):
    """Update existing data file"""
    try:
        data = request.get_json(force=True)
        content = (data or {}).get('content', '').strip()
        
        if not content:
            return jsonify({'status': 'error', 'message': 'Content required'}), 400
        
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        file_path = os.path.join(data_dir, filename)
        
        if not os.path.exists(file_path) or not filename.endswith('.txt'):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Rebuild vectorstore after updating data
        try:
            from RAG.rag_engine import get_rag_engine
            get_rag_engine().create_vector_store(force_rebuild=True)
        except Exception as e:
            print(f"Warning: Could not rebuild vectorstore: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'File updated successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-files/<filename>', methods=['DELETE'])
@token_required
def delete_data_file(current_user_id, filename):
    """Delete data file"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        file_path = os.path.join(data_dir, filename)
        
        if not os.path.exists(file_path) or not filename.endswith('.txt'):
            return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
        os.remove(file_path)
        
        # Rebuild vectorstore after deleting data
        try:
            from RAG.rag_engine import get_rag_engine
            get_rag_engine().create_vector_store(force_rebuild=True)
        except Exception as e:
            print(f"Warning: Could not rebuild vectorstore: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'File deleted successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/dashboard/data-files/upload', methods=['POST'])
@token_required
def upload_data_file(current_user_id):
    """Upload data file"""
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if not file.filename.endswith('.txt'):
            return jsonify({'status': 'error', 'message': 'Only .txt files allowed'}), 400
        
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        file_path = os.path.join(data_dir, file.filename)
        
        if os.path.exists(file_path):
            return jsonify({'status': 'error', 'message': 'File already exists'}), 400
        
        file.save(file_path)
        
        # Rebuild vectorstore after uploading new data
        try:
            from RAG.rag_engine import get_rag_engine
            get_rag_engine().create_vector_store(force_rebuild=True)
        except Exception as e:
            print(f"Warning: Could not rebuild vectorstore: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'File uploaded successfully',
            'filename': file.filename
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
    print('🖼️ Image management endpoints available at /api/dashboard/images/*')
    print('📁 Data file management endpoints available at /api/dashboard/data-files/*')
    app.run(host='0.0.0.0', port=5000, debug=True)