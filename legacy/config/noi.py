"""Vo boc giu nguyen chu ky cu, goi AI service o duoi.

Truoc day file nay chua 205 dong: goi Groq truc tiep, edge-tts sinh giong
noi, langdetect nhan dien ngon ngu. Toan bo phan do gio nam trong ai/voice.py
va duoc goi qua HTTP.

Giu nguyen ten va chu ky ba ham de moi cho import khong phai sua:
    from config.noi import detect_language, get_ai_response, synthesize_speech_to_bytes
"""

import logging

from _ai_client import AiServiceError
from _ai_client import answer as _answer
from _ai_client import detect_language as _detect
from _ai_client import tts as _tts

logger = logging.getLogger(__name__)


def detect_language(text: str) -> str:
    """Nhan dien vi/en. Loi thi mac dinh 'vi' - phan lon nguoi dung la tieng Viet."""
    try:
        return _detect(text)
    except AiServiceError as e:
        logger.error("detect_language that bai: %s", e)
        return "vi"


def get_ai_response(user_input: str, detected_lang: str) -> str:
    """Goi LLM KHONG qua vectorstore (duong /chat cu).

    Tra ve chuoi xin loi khi that bai, dung nhu ban cu - de giao dien khong
    phai xu ly exception.
    """
    try:
        return _answer(user_input, detected_lang, without_rag=True)
    except AiServiceError as e:
        logger.error("get_ai_response that bai: %s", e)
        if detected_lang == "en":
            return ("Sorry, I am having technical difficulties. "
                    "Please try again in a few minutes.")
        return ("Xin lỗi, hiện tại tôi đang gặp một số vấn đề kỹ thuật. "
                "Vui lòng thử hỏi lại câu hỏi sau vài phút.")


def synthesize_speech_to_bytes(text: str, lang: str = "vi") -> bytes:
    """MP3 dang bytes. Tra b'' khi that bai, dung nhu ban cu."""
    try:
        return _tts(text, lang)
    except AiServiceError as e:
        logger.error("synthesize_speech_to_bytes that bai: %s", e)
        return b""
