# ==========================================
# ProjectDrive Production Multi-Stage Dockerfile
# Full-Stack Node.js + SQLite + Persistent Storage
# ==========================================

# Stage 1: Build the React Frontend SPA
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy full source tree and build production static bundle
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install system utilities needed for native compilation if required
RUN apt-get update && apt-get install -y python3 make g++ openssh-client curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

# Copy package definitions and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server codebase and seed database
COPY server ./server

# Ensure persistent mount directories exist
RUN mkdir -p /app/data /app/uploads /app/data/backups /app/data/external_backups

# Expose production port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/auth/status || exit 1

# Start the unified backend & static frontend server
CMD ["npm", "run", "start"]
