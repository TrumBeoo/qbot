# Build tinh roi phuc vu bang nginx.
# Luu y: moi bien VITE_* duoc nhung vao bundle luc BUILD, khong doc luc chay.
# Doi API URL la phai build lai anh, khong phai restart container.
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Trinh duyet goi API tu may host, nen localhost o day la host chu khong
# phai container. Doi qua build arg trong compose khi deploy that.
ARG VITE_API_BASE_URL=http://localhost:5000
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_FACEBOOK_APP_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
