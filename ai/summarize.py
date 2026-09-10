"""Tom tat hoi thoai bang LLM.

Thay cho phan AI cua be/services/memory_service.py. Khac biet quan trong:
memory_service cu hien thuc mot langchain BaseChatMessageHistory doc/ghi
truc tiep MySQL (class MySQLChatMessageHistory, ~76 dong), va cac ham
get_user_preferences / get_memory_stats / cleanup_old_memories cung truy van
DB. Toan bo phan do la viec cua API, khong phai cua AI service.

O day hoi thoai duoc truyen vao trong request. AI service khong biet
database nao ton tai.
"""

import os
import re
import unicodedata
from typing import List, Dict

from langchain_groq import ChatGroq

# Bao nhieu tin nhan cuoi duoc dua vao prompt. Dat gioi han vi lich su dai
# vua ton token vua lam LLM tom tat lan man.
MAX_MESSAGES = 40

_llm = None


def _get_llm() -> ChatGroq:
    """Tao ChatGroq mot lan roi dung lai."""
    global _llm
    if _llm is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        _llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"),
            # Thap hon /chat: tom tat can on dinh, khong can sang tao.
            temperature=0.3,
            groq_api_key=key,
            max_tokens=512,
        )
    return _llm


def _as_transcript(messages: List[Dict[str, str]]) -> str:
    lines = []
    for m in messages[-MAX_MESSAGES:]:
        who = "Nguoi dung" if m.get("sender") == "user" else "QBot"
        text = (m.get("text") or "").strip()
        if text:
            lines.append(f"{who}: {text}")
    return "\n".join(lines)


def summarize(messages: List[Dict[str, str]], language: str = "vi") -> str:
    """Tra ve ban tom tat ngan cua hoi thoai.

    messages: [{"sender": "user"|"bot", "text": "..."}] theo thu tu thoi gian.
    """
    transcript = _as_transcript(messages)
    if not transcript:
        return ""

    if language == "vi":
        instruction = (
            "Tom tat cuoc hoi thoai sau thanh toi da 3 cau tieng Viet. "
            "Chi giu thong tin huu ich cho luot tra loi tiep theo: dia diem "
            "nguoi dung quan tam, rang buoc ho neu ra (ngan sach, so ngay, "
            "di cung ai), va viec dang lam do. Khong chao hoi, khong mo dau."
        )
    else:
        instruction = (
            "Summarize the following conversation in at most 3 English "
            "sentences. Keep only what helps answer the next question: "
            "places the user cares about, constraints they stated (budget, "
            "number of days, who they travel with), and any open task. "
            "No greeting, no preamble."
        )

    resp = _get_llm().invoke(f"{instruction}\n\n---\n{transcript}\n---")
    return (resp.content or "").strip()


# Tu dung de bo khoi danh sach chu de, viet KHONG DAU.
# So sanh qua _strip_accents nen "cho" o day khop ca "cho", "cho^~", "chO".
_STOPWORDS = {
    "cho", "toi", "minh", "ban", "co", "khong", "the", "nao", "gi", "la",
    "va", "voi", "duoc", "hay", "nhu", "khi", "den", "tai", "trong", "cua",
    "muon", "can", "cung", "nay", "do", "roi", "thi", "ma", "cac", "nhung",
    "and", "for", "with", "what", "where", "when", "how", "the",
    "you", "please", "about", "there", "that", "this", "have", "want", "need",
}


def _strip_accents(w: str) -> str:
    """Bo dau tieng Viet de so sanh voi _STOPWORDS.

    Can thiet vi van ban that co dau ("cho^~", "ca^`n", "muo^n") con danh
    sach stopword viet khong dau - khong chuan hoa thi bo loc truot het.
    """
    return "".join(
        c for c in unicodedata.normalize("NFD", w.lower())
        if unicodedata.category(c) != "Mn"
    )


def extract_topics(messages: List[Dict[str, str]], limit: int = 8) -> List[str]:
    """Cac tu khoa noi bat trong loi cua nguoi dung.

    Chi dem tu trong tin nhan cua NGUOI DUNG - loi cua bot lap lai rat nhieu
    ten dia danh nen dem ca hai ben se lech han ve nhung gi bot noi.
    """
    counts: Dict[str, int] = {}
    for m in messages:
        if m.get("sender") != "user":
            continue
        for w in re.findall(r"\w+", (m.get("text") or "").lower(), flags=re.UNICODE):
            if len(w) < 3 or w.isdigit() or _strip_accents(w) in _STOPWORDS:
                continue
            counts[w] = counts.get(w, 0) + 1
    return [w for w, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:limit]]


def demo() -> None:
    """Kiem tra phan khong goi mang. Chay: python summarize.py"""
    msgs = [
        {"sender": "user", "text": "Toi muon di Vinh Ha Long 3 ngay"},
        {"sender": "bot", "text": "Vinh Ha Long la di san UNESCO, Ha Long, Ha Long, Ha Long"},
        {"sender": "user", "text": "Ngan sach khoang 5 trieu, co khach san nao gan Bai Chay?"},
    ]

    t = _as_transcript(msgs)
    assert "Nguoi dung: Toi muon di Vinh Ha Long 3 ngay" in t
    assert "QBot: Vinh Ha Long la di san" in t

    # Chi dem loi nguoi dung: "long" xuat hien 1 lan ben nguoi dung du bot
    # nhac 4 lan. Neu dem ca hai ben thi "long" se dung dau.
    topics = extract_topics(msgs)
    assert "long" in topics, topics
    assert topics.count("long") == 1
    assert "ngan" in topics or "sach" in topics, topics
    # Stopword va so phai bi loai. Kiem ca dang CO DAU: bo loc chi co dang
    # khong dau nen phai chuan hoa truoc khi so sanh, khong thi "cho^~",
    # "ca^`n", "muo^n" deu lot qua.
    assert "toi" not in topics, topics
    accented = [
        {"sender": "user", "text": "Tôi muốn chỗ nào cần yên tĩnh, đi cùng vợ"},
    ]
    at = extract_topics(accented)
    for stop in ("tôi", "muốn", "chỗ", "cần", "cùng", "nào"):
        assert stop not in at, f"{stop!r} phai bi loc nhung con trong {at}"
    assert "yên" in at or "tĩnh" in at, at
    assert not any(t.isdigit() for t in topics), topics

    # Cat bot lich su qua dai
    long_hist = [{"sender": "user", "text": f"cau {i}"} for i in range(100)]
    assert _as_transcript(long_hist).count("\n") == MAX_MESSAGES - 1

    # Hoi thoai rong tra ve chuoi rong, khong goi LLM
    assert summarize([]) == ""

    print("summarize demo OK")


if __name__ == "__main__":
    demo()
