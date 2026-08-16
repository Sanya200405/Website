# ==========================================
# ProjectDrive Production Cloud Container
# Full-Stack Node.js + SQLite + Persistent Storage
# ==========================================
FROM node:20-bookworm-slim

WORKDIR /app

# Install build tools for native SQLite C++ bindings and curl for healthchecks
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (with clean install)
RUN npm install

# Copy application source code and seed database
COPY . .

# Build production React frontend SPA to dist/
RUN npm run build

# Ensure persistent mount directories exist
RUN mkdir -p /app/data /app/uploads /app/data/backups /app/data/external_backups

# Production environment configuration
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/auth/status || exit 1

# Start the unified full-stack application
CMD ["npm", "run", "start"]
