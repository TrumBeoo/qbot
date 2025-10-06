from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Lấy chuỗi kết nối MongoDB từ biến môi trường
MONGO_URI = os.getenv("MONGO_URI")

# ✅ Truyền biến MONGO_URI chứ không phải chuỗi "MONGO_URI"
client = MongoClient(MONGO_URI)

# Tên database
mongo_db = client["chatbot_AI"]
db = mongo_db  # Export db object for other modules

# Expose collections
users_collection = mongo_db["users"]
admin_user_collection = mongo_db["admins"]
data_collection = mongo_db["data"]
chat_collection = mongo_db["chat_history"]  
