# 🐳 Singh Rent Management - Docker & Docker Hub Guide

This guide explains how to build, run, and upload your Spring Boot Backend and Next.js Frontend Docker images to **Docker Hub**.

---

## 📋 Prerequisites
1. **Docker Desktop**: Open and start Docker Desktop on your Windows machine. Verify by opening PowerShell and running:
   ```bash
   docker info
   ```
2. **Docker Hub Account**: Create a free account at [hub.docker.com](https://hub.docker.com) if you don't already have one.

---

## 🚀 Option 1: 1-Click Automated Script (Recommended)

Simply double-click or run the included batch file in your terminal:
```cmd
.\docker-build-push.bat
```
It will prompt you for your **Docker Hub username** and tag (e.g. `latest`), login, build both images, and push them to your Docker Hub repository automatically!

---

## 🛠️ Option 2: Step-by-Step Manual Commands

Replace `<your_dockerhub_username>` with your actual Docker Hub username (e.g. `krishnasingh`).

### Step 1: Login to Docker Hub
```bash
docker login
```
*(Enter your Docker Hub username and password / Personal Access Token)*

---

### Step 2: Build the Backend Image
Navigate to the root directory and run:
```bash
docker build -t agroxgamerzz/rent-app-backend:latest ./rent-management-backend
```

---

### Step 3: Build the Frontend Image
```bash
docker build -t agroxgamerzz/rent-app-frontend:latest ./rent-management-frontend
```

---

### Step 4: Push Images to Docker Hub
```bash
# Push Backend
docker push agroxgamerzz/rent-app:latest
docker push agroxgamerzz/rent-app-backend:latest

# Push Frontend
docker push agroxgamerzz/rent-app-frontend:latest
```

---

## 🏃‍♂️ How to Run the Entire App Locally with Docker Compose

To start PostgreSQL Database, Backend, and Frontend all together with a single command:

```bash
docker compose up -d --build
```

### Access Services:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: root`, `db: rent_management_db`)

### To Stop Containers:
```bash
docker compose down
```
