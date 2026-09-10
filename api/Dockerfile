# API TypeScript (pha 04). ~1GB - khong co torch nen nho hon ai/be nhieu,
# nhung @prisma/client 6.x mang theo query engine va goi effect (~110MB)
# nen khong the nho nhu mot API Node thong thuong.
FROM node:22-slim AS build
WORKDIR /app

# openssl: Prisma engine can. Thieu la loi luc `prisma generate`.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Copy schema truoc khi generate: Prisma Client sinh ra tu schema, va layer
# nay chi phai lam lai khi schema doi.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


FROM node:22-slim
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl curl \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package.json package-lock.json ./
# omit=dev: bo prisma CLI, typescript, ts-node khoi anh chay.
RUN npm ci --omit=dev

# Chi copy .prisma (Prisma Client DA SINH). Khong copy ca @prisma: npm ci
# o tren da cai no roi, copy de len chi tao mot layer trung ~110MB ma anh
# van phai mang.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
# Migration di kem anh de `prisma migrate deploy` chay duoc tu container.
COPY prisma ./prisma

USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/main.js"]
