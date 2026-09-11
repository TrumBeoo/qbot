# API TypeScript (pha 04).
#
# MOT stage, khong phai hai. Ly do: pnpm dat node_modules dang symlink vao
# store, nen Prisma Client sinh ra nam trong
# node_modules/.pnpm/@prisma+client@<phien-ban>_<hash>/node_modules/.prisma.
# Ten thu muc do co hash nen copy giua cac stage rat mong manh - da thu va
# build that bai voi "/app/node_modules/.prisma: not found".
#
# Gia phai tra: anh mang theo ca devDependencies (prisma CLI ~51MB,
# typescript ~23MB). Doi lay viec build khong vo khi doi phien ban Prisma.
FROM node:22-slim

# openssl: Prisma engine can. curl: cho healthcheck.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# corepack kich hoat pnpm dung phien ban ghi trong "packageManager".
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile: build that bai neu lockfile lech package.json, thay vi
# am tham cai phien ban khac voi may dev.
RUN pnpm install --frozen-lockfile

# Schema copy rieng truoc: layer generate chi phai lam lai khi schema doi,
# khong phai moi lan sua code.
COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

ENV NODE_ENV=production

USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/main.js"]
