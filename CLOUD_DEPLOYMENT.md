# ProjectDrive — 24/7 Persistent Cloud Deployment & Migration Guide

This document explains how **ProjectDrive** runs 24/7 on persistent cloud infrastructure without requiring any local laptop or server to remain powered on.

---

## 1. Cloud Architecture Overview

```
Authorized Team Members (Any Device / Any Network)
                     │
                     ▼ (HTTPS / Port 443)
       Global Cloud Load Balancer & SSL
                     │
                     ▼ (Port 3001 or 8080)
   ProjectDrive Node.js Express Container
  ┌───────────────────────────────────────────────┐
  │ • Express Backend API (/api/*)                │
  │ • React Frontend SPA (dist/)                  │
  │ • JWT Authentication & Role-Based Access      │
  │ • File Upload Streaming (/uploads/*)          │
  └──────────────────┬────────────────────────────┘
                     │
                     ▼
       Persistent Cloud Disk Volume Mount
  ┌───────────────────────────────────────────────┐
  │ • /app/data/project.db (SQLite in WAL mode)   │
  │ • /app/uploads/ (PDFs, CSV logs, datasheets)  │
  │ • /app/data/backups/ (Snapshot archives)      │
  │ • /app/data/external_backups/ (Disaster DR)   │
  └───────────────────────────────────────────────┘
```

---

## 2. 1-Click Cloud Deployment Options

### Option A: Render (Recommended for 24/7 Managed Cloud)
1. Log in to [Render.com](https://render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Sanya200405/Website.git`.
4. Render will detect `render.yaml` automatically.
5. Click **Apply**. Render will:
   - Build the Docker container.
   - Attach a persistent SSD disk to `/var/data`.
   - Assign a persistent HTTPS URL: `https://projectdrive.onrender.com`.
   - Keep the application online 24/7.

---

### Option B: Railway
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Sanya200405/Website`.
4. Add a **Volume** mounted to `/app/data` and `/app/uploads`.
5. Under Settings, click **Generate Domain** (gives `https://projectdrive.up.railway.app`).

---

### Option C: Fly.io
1. Install flyctl: `winget install flyctl` (or `curl -L https://fly.io/install.sh | sh`).
2. Run in project directory:
   ```bash
   fly launch
   fly volumes create projectdrive_data --size 1
   fly deploy
   ```
3. Your app is live at `https://projectdrive-foc.fly.dev`.

---

### Option D: Self-Hosted Cloud VPS (Ubuntu / Debian / AWS EC2 / DigitalOcean)
1. Clone the repository on your cloud server:
   ```bash
   git clone https://github.com/Sanya200405/Website.git
   cd Website
   ```
2. Start with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. The server starts on port 3001 with named persistent volumes `projectdrive_data` and `projectdrive_uploads`.

---

## 3. Persistent Data & User Accounts

### Pre-Seeded Accounts (Active Immediately on First Cloud Boot)
- **Administrator:**
  - Name: `Akanksha Singh`
  - Email: `akanksha05122005@gmail.com`
  - Role: `admin`
- **Project Members:**
  - `btbtl24061_ehna@banasthali.in` (Ehna)
  - `btbtr24085_koshika@banasthali.in` (Koshika)
  - `btbtl24051_sunistha@banasthali.in` (Sunistha)
  - `btbtl24123_kumari@banasthali.in` (Arpana)

### Automatic Seeding Engine
When the container boots on a fresh cloud volume, if `/app/data/project.db` does not exist yet, the server automatically initializes from `server/project_seed.db`. All 5 team member accounts, motor parameters, research papers, and notes are instantly live.

---

## 4. How to Backup & Restore in the Future

### Creating a Cloud Backup
1. Log in as Administrator.
2. Navigate to **Admin Console** → **Backups & Resilience**.
3. Click **Download Live Bundle (.ZIP)** or **Trigger External Backup Now**.
4. The downloaded `.zip` contains the complete database (`project.db`), JSON data dump, and all uploaded physical files.

### Restoring on a New Cloud Server
1. Go to **Admin Console** → **Backups & Resilience**.
2. Click **Restore Complete Project Archive (.ZIP)**.
3. Select or upload your backup `.zip`.
4. Type `RESTORE` and confirm. Both the SQLite database and all uploaded files will be unpacked and verified automatically.
