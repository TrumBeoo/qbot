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

# Chat-related collections moved to MySQL
#chat_collection = mongo_db["chat_history"]  # Now in MySQL
#messages_collection = mongo_db["messages"]  # Now in MySQL
#dashboard_users_collection = mongo_db["dashboard_users"]
#dashboard_data_collection = mongo_db["dashboard_data"]