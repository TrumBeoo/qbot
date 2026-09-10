import os
import asyncio
import tempfile
import base64
import requests
import edge_tts
from langdetect import detect
import pytz
from datetime import datetime
from dotenv import load_dotenv

# noi.py cu dua vao app.py goi load_dotenv() truoc. AI service chay doc lap
# nen tu nap .env o day. Trong Docker thi env den tu environment, goi nay
# khong lam gi ca nhung cung khong hai.
load_dotenv()

# API configuration
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_api_key")
headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

EDGE_VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',
    'en': 'en-US-AriaNeural'
}


def detect_language(text: str) -> str:
    """Detect language for given text, fallback to vi/en heuristic."""
    try:
        detected = detect(text)
        print(f"langdetect result: {detected}")
        # Map common language codes to supported ones
        if detected in ['vi', 'vietnamese']:
            return 'vi'
        elif detected in ['en', 'english']:
            return 'en'
        else:
            # Use fallback detection for uncertain cases
            return _fallback_language_detection(text)
    except Exception as e:
        print(f"langdetect failed: {e}, using fallback")
        return _fallback_language_detection(text)

def _fallback_language_detection(text: str) -> str:
    """Enhanced fallback language detection."""
    text_lower = text.lower().strip()
    
    # Vietnamese diacritics - strong indicator
    vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
    if any(char in text_lower for char in vietnamese_chars):
        return 'vi'
    
    # Common Vietnamese words
    vietnamese_words = ['tôi', 'bạn', 'chúng', 'của', 'trong', 'một', 'có', 'được', 'này', 'đó', 'là', 'và', 'với', 'cho', 'về', 'du lịch', 'quảng ninh', 'hạ long', 'xin chào', 'cảm ơn', 'vịnh', 'thành phố']
    # Common English words and phrases
    english_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'this', 'that', 'is', 'are', 'what', 'where', 'how', 'can', 'could', 'would', 'travel', 'tourism', 'quang ninh', 'ha long', 'hello', 'thank you', 'bay', 'city']
    
    # Count word matches
    vi_score = sum(1 for word in vietnamese_words if word in text_lower)
    en_score = sum(1 for word in english_words if word in text_lower)
    
    # Strong English indicators
    english_patterns = ['what', 'where', 'how', 'can you', 'could you', 'would you', 'tell me', 'show me', 'hello', 'hi ', 'thanks', 'please']
    for pattern in english_patterns:
        if pattern in text_lower:
            en_score += 3
    
    # Strong Vietnamese indicators
    vietnamese_patterns = ['bạn có thể', 'cho tôi biết', 'giới thiệu', 'hãy', 'làm sao', 'xin chào', 'cảm ơn', 'vui lòng']
    for pattern in vietnamese_patterns:
        if pattern in text_lower:
            vi_score += 3
    
    # Check for English sentence structure
    if any(text_lower.startswith(start) for start in ['what ', 'where ', 'how ', 'can ', 'could ', 'would ', 'do you', 'are you']):
        en_score += 2
    
    # Check for Vietnamese sentence structure
    if any(text_lower.startswith(start) for start in ['bạn ', 'tôi ', 'làm ', 'có ', 'được ']):
        vi_score += 2
    
    print(f"Language detection - Text: '{text}' | VI score: {vi_score} | EN score: {en_score}")
    
    return 'en' if en_score > vi_score else 'vi'


def get_ai_response(user_input: str, detected_lang: str) -> str:
    """Call Groq Chat Completions to get an AI response constrained by domain/lang."""
    try:
        if detected_lang == 'vi':
            system_prompt = (
                """Bạn là một trợ lý du lịch thông minh của Thành Phố Quảng Ninh, Việt Nam. Bạn tên là QBot.
                Khi được hỏi bằng tiếng Việt, bạn phải trả lời bằng tiếng Việt. 
                Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm tham quan, lịch trình, 
                khách sạn, nhà hàng, ẩm thực địa phương, văn hóa, lịch sử, giao thông, thời tiết, 
                chi phí du lịch, hoạt động giải trí, v.v. 
                
                Phạm vi trả lời của bạn CHỈ giới hạn trong các địa phương và các địa điểm du lịch thành phố Quảng Ninh (bao gồm Hạ Long, Cẩm Phả, 
                Móng Cái, Đông Triều, Quảng Yên, v.v.). 
                
                Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài thành phố Quảng Ninh, hãy lịch sự 
                từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh.
                
                Hãy trả lời một cách thân thiện, nhiệt tình và cung cấp thông tin hữu ích."""
            )
        else:
            system_prompt = (
                """You are a smart travel assistant specializing in Quang Ninh City, Vietnam. Your name is QBot.
                When asked in English, you MUST respond in English. 
                You only answer questions related to travel such as: tourist destinations, itineraries, 
                hotels, restaurants, local cuisine, culture, history, transportation, weather, 
                travel costs, entertainment activities, etc. 
                
                Your answers are STRICTLY limited to Quang Ninh City (including Ha Long, Cam Pha, 
                Mong Cai, Dong Trieu, Quang Yen, etc.). 
                
                If the question is not travel-related or is outside Quang Ninh City, politely 
                decline and suggest asking about travel in Quang Ninh.
                
                Please respond in a friendly, enthusiastic manner and provide useful information."""
            )

        data = {
            "model": os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 300  # Increased for better responses
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            content = content.replace('*', '').strip()
            
            # Ensure proper sentence ending
            if content and content[-1] not in ['.', '!', '?']:
                content += '.'
                
            return content
        else:
            error_msg = (
                "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!" 
                if detected_lang == 'vi' 
                else "Sorry, I'm experiencing technical issues. Please try again later!"
            )
            return error_msg
            
    except Exception as e:
        print(f"API Error: {e}")
        error_msg = (
            "Tôi đang bận, vui lòng thử lại sau!" 
            if detected_lang == 'vi' 
            else "I'm busy right now, please try again later!"
        )
        return error_msg


def synthesize_speech_to_bytes(text: str, lang: str = 'vi') -> bytes:
    """Synthesize speech with Edge TTS and return MP3 bytes."""
    # Ensure we use the correct voice for the detected language
    voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])
    
    print(f"TTS: Using voice '{voice}' for language '{lang}'")

    async def _run() -> bytes:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(tmp_path)
            with open(tmp_path, 'rb') as f:
                data = f.read()
            return data
        except Exception as e:
            print(f"TTS Error: {e}")
            return b''  # Return empty bytes on error
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    # Run the async function in a fresh loop to avoid conflicts
    return asyncio.run(_run())


if __name__ == '__main__':
    print("🚀 Chatbot du lịch đã sẵn sàng (chế độ dòng lệnh)! Gõ 'exit' để thoát.")
    while True:
        try:
            user = input("Bạn: ").strip()
            if not user:
                continue
            if user.lower() in {"exit", "quit", "bye", "tạm biệt"}:
                print("👋 Tạm biệt!")
                break
            lang = detect_language(user)
            print(f"[Detected language: {lang}]")
            answer = get_ai_response(user, lang)
            print(f"Bot: {answer}")
        except KeyboardInterrupt:
            print("\n👋 Tạm biệt!")
            break