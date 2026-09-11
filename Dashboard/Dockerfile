# Dashboard admin. Cung mo hinh nhu fe/: build tinh, nginx phuc vu.
FROM node:22-slim AS build
WORKDIR /app

# corepack kich hoat pnpm dung phien ban ghi trong "packageManager".
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile: build that bai neu lockfile lech package.json, thay vi
# am tham cai phien ban khac voi may dev.
RUN pnpm install --frozen-lockfile

COPY . .

# Chu y: Dashboard dung ten bien KHAC fe/ (VITE_API_URL, khong phai
# VITE_API_BASE_URL) va gia tri PHAI co /api o cuoi.
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_FACEBOOK_APP_ID=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID

RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
