FROM node:24-alpine

WORKDIR /app

# ── Install dependencies (cached layer) ──────────────────────────
COPY client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps

COPY server/package*.json ./server/
RUN cd server && npm install

# ── Copy source code ─────────────────────────────────────────────
COPY . .

# ── Build frontend production bundle ─────────────────────────────
RUN cd client && npm run build

# ── Runtime settings ─────────────────────────────────────────────
ENV NODE_ENV=production
# PORT is injected by Koyeb/Render at runtime (default fallback: 8000)
ENV PORT=8000

EXPOSE 8000

CMD ["node", "server/src/server.js"]
