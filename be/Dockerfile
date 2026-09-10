# Backend Flask + RAG. Anh nay nang (~2GB) vi torch va transformers,
# do la gia phai tra cho embedding chay tren CPU.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/cache/huggingface

WORKDIR /app

# curl cho healthcheck. libgomp1 la runtime OpenMP ma faiss-cpu can.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl libgomp1 \
 && rm -rf /var/lib/apt/lists/*

# torch cai rieng tu index CPU-only. May chay khong co GPU NVIDIA nen
# ban mac dinh tren PyPI chi keo ve ~2.5GB wheel CUDA khong dung tới.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.8.0

# requirements copy rieng truoc code de layer nay duoc cache lai
# khi chi sua code Python.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Chay bang user thuong, nhung uid PHAI khop uid cua host.
# Ly do: vectorstore/ va static/images/ la bind mount, nen file mang
# ownership cua host. Uid lech la container khong ghi duoc va RAG chet voi
# "could not open vectorstore/index/index.faiss for writing: Permission denied".
# Doi qua build arg neu host cua ban khong phai uid 1000.
ARG APP_UID=1000
ARG APP_GID=1000
RUN groupadd --gid ${APP_GID} qbot 2>/dev/null || true \
 && useradd --create-home --uid ${APP_UID} --gid ${APP_GID} qbot \
 && mkdir -p /cache/huggingface /app/vectorstore /app/static/images/uploads \
 && chown -R ${APP_UID}:${APP_GID} /cache /app
USER qbot

EXPOSE 5555

HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -fsS http://127.0.0.1:5555/health || exit 1

CMD ["python", "app.py"]
