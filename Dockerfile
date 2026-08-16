# ==========================================
# ProjectDrive Production Cloud Container
# Full-Stack Node.js + SQLite + Persistent Storage
# ==========================================
FROM node:20-bookworm-slim

WORKDIR /app

# Install native C++ build toolchain for SQLite bindings and curl for healthchecks
RUN apt-get update && apt-get install -y python3 make g++ gcc curl && rm -rf /var/lib/apt/lists/*

# Copy package dependency definitions
COPY package.json package-lock.json ./

# Install dependencies and explicitly rebuild native SQLite bindings for target Linux runtime
RUN npm install && npm rebuild better-sqlite3 --build-from-source

# Copy application source tree (.dockerignore excludes local node_modules, data/*.db-shm)
COPY . .

# Build production React SPA and precompiled server JS bundle
RUN npm run build

# Ensure persistent storage volume directories exist
RUN mkdir -p /app/data /app/uploads /app/data/backups /app/data/external_backups

# Production environment configuration
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

EXPOSE 10000

# Start the production unified server
CMD ["npm", "run", "start"]
