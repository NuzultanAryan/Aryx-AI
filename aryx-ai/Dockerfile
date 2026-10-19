FROM node:24-alpine

WORKDIR /app

# Copy dependency files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm install
RUN cd ../server && npm install

# Copy source code
COPY . .

# Build frontend production bundle
RUN cd client && npm run build

# Environment settings
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/src/server.js"]
