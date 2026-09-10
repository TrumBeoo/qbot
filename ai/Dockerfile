# AI service: RAG, TTS, nhan dien ngon ngu.
# Van nang (~2.4GB) vi torch + transformers cho embedding tren CPU, nhung
# da bo 11 goi ma phan CRUD can (Flask, driver MySQL/Mongo, PyJWT, bcrypt...).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/cache/huggingface

WORKDIR /app

# curl cho healthcheck, libgomp1 la runtime OpenMP ma faiss-cpu can.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl libgomp1 \
 && rm -rf /var/lib/apt/lists/*

# torch tu index CPU-only: may khong co GPU NVIDIA, ban tren PyPI keo ve
# ~2.5GB wheel CUDA khong dung tới.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.8.0

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Uid phai khop uid host: vectorstore/ la bind mount nen file mang ownership
# cua host. Xem ghi chu trong be/Dockerfile.
ARG APP_UID=1000
ARG APP_GID=1000
RUN groupadd --gid ${APP_GID} qbot 2>/dev/null || true \
 && useradd --create-home --uid ${APP_UID} --gid ${APP_GID} qbot \
 && mkdir -p /cache/huggingface /app/vectorstore /app/data \
 && chown -R ${APP_UID}:${APP_GID} /cache /app
USER qbot

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# Mot worker: model embedding chiem ~500MB RAM, moi worker nap mot ban rieng.
# Can throughput hon thi tang --workers va tang RAM tuong ung.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
