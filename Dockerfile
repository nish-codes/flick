# ── Stage 1: Build the React frontend ──────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Production backend ─────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ ./
RUN mkdir -p public/temp

COPY --from=frontend /frontend/dist ./public/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
