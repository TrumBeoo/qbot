"""HTTP client goi AI service.

Truoc day legacy/ mang mot BAN COPY cua toan bo code AI (RAG/rag_engine.py,
RAG/loader.py, config/noi.py - 854 dong) trung voi ai/. Ban copy do keo theo
torch, transformers, sentence-transformers va faiss-cpu, lam anh Docker cua
legacy nang 2.43GB.

Gio legacy goi ai/ qua HTTP. Module nay la cho duy nhat biet dieu do; hai
module RAG/rag_engine.py va config/noi.py chi con la vo boc giu nguyen chu ky
cu, nen 29 cho goi trong app.py khong phai sua.
"""

import base64
import os

import requests

AI_URL = os.getenv("AI_SERVICE_URL", "http://ai:8000")
AI_TOKEN = os.getenv("AI_SERVICE_TOKEN", "")

# RAG co the mat vai chuc giay khi phai nap model lan dau.
TIMEOUT = int(os.getenv("AI_SERVICE_TIMEOUT", 180))


class AiServiceError(RuntimeError):
    pass


def call(path: str, body: dict | None = None, method: str = "POST") -> dict:
    """Goi AI service. Nem AiServiceError de cho goi tu quyet dinh fallback."""
    if not AI_TOKEN:
        raise AiServiceError("AI_SERVICE_TOKEN chua duoc cau hinh")
    try:
        resp = requests.request(
            method,
            f"{AI_URL}{path}",
            json=body if method == "POST" else None,
            headers={"Authorization": f"Bearer {AI_TOKEN}"},
            timeout=TIMEOUT,
        )
    except requests.RequestException as e:
        raise AiServiceError(f"khong goi duoc AI service: {e}") from e
    if not resp.ok:
        raise AiServiceError(f"AI service tra {resp.status_code}: {resp.text[:200]}")
    return resp.json()


def answer(question: str, language: str | None = None, without_rag: bool = False) -> str:
    body: dict = {"question": question, "without_rag": without_rag}
    if language:
        body["language"] = language
    return call("/rag/answer", body)["answer"]


def detect_language(text: str) -> str:
    return call("/detect-language", {"text": text})["language"]


def tts(text: str, language: str = "vi") -> bytes:
    data = call("/tts", {"text": text, "language": language})
    return base64.b64decode(data["audio_base64"])


def reindex() -> dict:
    return call("/rag/reindex", {})


def stats() -> dict:
    return call("/rag/stats", method="GET")


def search(query: str, k: int = 5) -> list[dict]:
    return call("/rag/search", {"query": query, "k": k})["hits"]
