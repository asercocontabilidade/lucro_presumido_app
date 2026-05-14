# ─── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-build
WORKDIR /backend
RUN apk add --no-cache openssl ca-certificates libc6-compat
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Imagem de produção ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl ca-certificates libc6-compat
COPY --from=backend-build /backend/node_modules ./node_modules
COPY --from=backend-build /backend/dist       ./dist
COPY --from=frontend-build /frontend/dist     ./public
EXPOSE 3003
CMD ["node", "dist/index.js"]
