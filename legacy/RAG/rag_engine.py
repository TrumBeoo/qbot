"""Vo boc giu nguyen chu ky cu, goi AI service o duoi.

Truoc day day la 562 dong: FAISS, HuggingFaceEmbeddings, langchain
RetrievalQA. Toan bo nam trong ai/rag/rag_engine.py va duoc goi qua HTTP,
nen legacy khong con can torch, transformers, sentence-transformers hay
faiss-cpu.

Giu ten va chu ky de moi cho import khong phai sua:
    from RAG.rag_engine import ask_question, get_rag_engine, RAGEngine
"""

import logging
from typing import Any, Dict, List

from _ai_client import AiServiceError
from _ai_client import answer as _answer
from _ai_client import reindex as _reindex
from _ai_client import search as _search
from _ai_client import stats as _stats

logger = logging.getLogger(__name__)


class RAGEngine:
    """Cung be mat method voi ban cu, nhung khong giu state gi.

    Vectorstore va model nam ben ai/. Class nay chi chuyen tiep.
    """

    def ask_question(self, query: str, language: str = "vi",
                     return_sources: bool = False) -> str:
        try:
            return _answer(query, language)
        except AiServiceError as e:
            logger.error("ask_question that bai: %s", e)
            if language == "en":
                return ("Sorry, I am having technical difficulties. "
                        "Please try again in a few minutes.")
            return ("Xin lỗi, hiện tại tôi đang gặp một số vấn đề kỹ thuật. "
                    "Vui lòng thử hỏi lại câu hỏi sau vài phút.")

    def create_vector_store(self, force_rebuild: bool = False) -> None:
        """Build lai index. force_rebuild bi bo qua: /rag/reindex luon build lai."""
        _reindex()

    def get_stats(self) -> Dict[str, Any]:
        try:
            # GET /rag/stats tra dict PHANG, khong boc trong khoa "stats".
            # Ban dau toi viet .get("stats", {}) nen luon ra rong.
            return _stats()
        except AiServiceError as e:
            logger.error("get_stats that bai: %s", e)
            return {}

    def search_similar(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Tra ve list dict {content, metadata}, KHONG phai Document cua langchain.

        Ban cu tra ve Document. Cho goi duy nhat (/search-similar trong
        app.py) chi doc .page_content va .metadata nen da sua sang dict.
        """
        return _search(query, k)


_engine = RAGEngine()


def get_rag_engine() -> RAGEngine:
    return _engine


def ask_question(query: str, language: str = "vi") -> str:
    return _engine.ask_question(query, language)


def create_vector_store() -> None:
    _engine.create_vector_store()
