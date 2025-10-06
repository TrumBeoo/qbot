@echo off
echo 🧪 Testing MongoDB Chat History System
echo =====================================
echo.

echo 📋 Prerequisites:
echo - Backend server running on http://localhost:5000
echo - MongoDB running and accessible
echo - All dependencies installed
echo.

pause

echo 🚀 Starting MongoDB Chat Test...
cd /d "%~dp0backend"
python test_mongodb_chat.py

echo.
echo ✨ Test completed! Check the output above for results.
pause