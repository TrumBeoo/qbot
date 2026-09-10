"""AI service cua QBot.

Service NOI BO. Khong mo ra internet: chi API TypeScript goi vao, xac thuc
bang mot token dung chung (AI_SERVICE_TOKEN).

Nguyen tac cua ranh gioi nay: service KHONG doc database. Moi thu no can
phai nam trong request. Giu duoc dieu do thi sau nay doi store, scale rieng,
hay thay han service deu de.

Logic AI ben duoi (rag/, voice.py) giu nguyen tu ban Flask, khong sua.
"""

import base64
import os
import secrets
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

load_dotenv()

import summarize as summarize_mod
import voice
from rag.rag_engine import get_rag_engine

AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "")

app = FastAPI(
    title="QBot AI service",
    version="0.1.0",
    description="RAG, TTS va nhan dien ngon ngu. Service noi bo.",
)


def require_token(authorization: str = Header(default="")) -> None:
    """Xac thuc bang token dung chung.

    So sanh bang compare_digest de khong ro ri do dai/noi dung qua thoi gian
    phan hoi. Neu AI_SERVICE_TOKEN khong duoc dat thi tu choi het - mac dinh
    mo cua la kieu loi de xay ra khi deploy.
    """
    if not AI_SERVICE_TOKEN:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AI_SERVICE_TOKEN chua duoc cau hinh tren service",
        )
    prefix = "Bearer "
    given = authorization[len(prefix):] if authorization.startswith(prefix) else ""
    if not secrets.compare_digest(given, AI_SERVICE_TOKEN):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token khong hop le")


Protected = [Depends(require_token)]


# ============================================================
# Models
# ============================================================

class ChatMessage(BaseModel):
    sender: Literal["user", "bot"]
    text: str


class AnswerIn(BaseModel):
    question: str = Field(min_length=1)
    # Bo trong thi service tu nhan dien.
    language: Optional[Literal["vi", "en"]] = None
    # Lich su do API nap tu Postgres roi truyen vao. AI service khong tu doc.
    history: List[ChatMessage] = Field(default_factory=list)
    # True: goi Groq truc tiep khong qua vectorstore (duong /chat cu khi
    # nguoi dung hoi ngoai pham vi tai lieu).
    without_rag: bool = False


class AnswerOut(BaseModel):
    answer: str
    language: str


class SearchIn(BaseModel):
    query: str = Field(min_length=1)
    k: int = Field(default=4, ge=1, le=20)


class SearchHit(BaseModel):
    content: str
    metadata: dict


class SearchOut(BaseModel):
    hits: List[SearchHit]


class ReindexOut(BaseModel):
    rebuilt: bool
    stats: dict


class TtsIn(BaseModel):
    text: str = Field(min_length=1)
    language: Literal["vi", "en"] = "vi"


class TtsOut(BaseModel):
    # base64 vi JSON khong chua duoc byte tho. mime de client biet cach phat.
    audio_base64: str
    mime_type: str = "audio/mpeg"


class DetectIn(BaseModel):
    text: str = Field(min_length=1)


class DetectOut(BaseModel):
    language: str


class SummarizeIn(BaseModel):
    messages: List[ChatMessage] = Field(min_length=1)
    language: Literal["vi", "en"] = "vi"


class SummarizeOut(BaseModel):
    summary: str
    topics: List[str]


# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
def health() -> dict:
    """Khong yeu cau token: docker healthcheck goi endpoint nay."""
    return {"status": "healthy", "service": "ai"}


@app.get("/rag/stats", dependencies=Protected)
def rag_stats() -> dict:
    return get_rag_engine().get_stats()


@app.post("/rag/answer", response_model=AnswerOut, dependencies=Protected)
def rag_answer(body: AnswerIn) -> AnswerOut:
    lang = body.language or voice.detect_language(body.question)

    question = body.question
    if body.history:
        # Dua lich su vao cau hoi thay vi giu state trong service: service
        # khong co phien, moi request tu chua du ngu canh.
        ctx = "\n".join(
            f"{'Nguoi dung' if m.sender == 'user' else 'QBot'}: {m.text}"
            for m in body.history[-10:]
        )
        question = f"Ngu canh hoi thoai truoc do:\n{ctx}\n\nCau hoi: {body.question}"

    if body.without_rag:
        answer = voice.get_ai_response(question, lang)
    else:
        answer = get_rag_engine().ask_question(question, lang)

    return AnswerOut(answer=answer, language=lang)


@app.post("/rag/search", response_model=SearchOut, dependencies=Protected)
def rag_search(body: SearchIn) -> SearchOut:
    docs = get_rag_engine().search_similar(body.query, k=body.k)
    return SearchOut(
        hits=[SearchHit(content=d.page_content, metadata=d.metadata) for d in docs]
    )


@app.post("/rag/reindex", response_model=ReindexOut, dependencies=Protected)
def rag_reindex() -> ReindexOut:
    """Build lai vectorstore tu cac file trong data/.

    Dong bo va co the mat vai chuc giay. API nen goi endpoint nay tu mot job
    nen, dung chan request cua nguoi dung.
    """
    engine = get_rag_engine()
    engine.create_vector_store(force_rebuild=True)
    return ReindexOut(rebuilt=True, stats=engine.get_stats())


@app.post("/tts", response_model=TtsOut, dependencies=Protected)
def tts(body: TtsIn) -> TtsOut:
    audio = voice.synthesize_speech_to_bytes(body.text, body.language)
    if not audio:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Sinh giong noi that bai")
    return TtsOut(audio_base64=base64.b64encode(audio).decode("ascii"))


@app.post("/detect-language", response_model=DetectOut, dependencies=Protected)
def detect_language(body: DetectIn) -> DetectOut:
    return DetectOut(language=voice.detect_language(body.text))


@app.post("/summarize", response_model=SummarizeOut, dependencies=Protected)
def summarize_conversation(body: SummarizeIn) -> SummarizeOut:
    msgs = [m.model_dump() for m in body.messages]
    return SummarizeOut(
        summary=summarize_mod.summarize(msgs, body.language),
        topics=summarize_mod.extract_topics(msgs),
    )
