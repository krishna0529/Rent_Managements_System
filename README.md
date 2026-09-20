# 🏢 Singh Rent House - Smart Property & Rent Management System

[![Java](https://img.shields.io/badge/Java-25-orange.svg?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](https://www.docker.com/)

A modern, full-stack rental property and tenant management system engineered with **Spring Boot 4**, **Next.js 16 (App Router)**, **PostgreSQL**, and **Docker**. Designed for property owners, landlords, and tenants to automate rent cycles, electricity sub-meter calculations, KYC document verification, payments, and automated email reminders.

---

## 🌟 Key Features

### 👨‍💼 1. Admin Management Suite
- **Live Database Telemetry & Analytics**: Real-time KPI tiles for monthly rental yields, total realized collections, pending dues, vacant/occupied unit counts, and power demand.
- **Dynamic Period Filtering**: Switch analytics between:
  - `Live DB Telemetry` (All-time dynamic database aggregate)
  - `Current Cycle` (Active month billing cycle)
  - `Year-To-Date` (Calendar year yield and revenue trends)
- **Financial CSV Export**: One-click CSV export with Microsoft Excel UTF-8 BOM encoding for clean currency, tenant names, and payment modes.
- **Tenant KYC & Verification Engine**: Review uploaded Aadhaar documents and profile photos, approve/reject tenant registrations, and assign rooms.
- **Electricity Billing & Sub-Meter Engine**: Record previous and current meter readings, automatically calculate units consumed (kWh) and bill amounts at configurable rates (e.g. ₹6.00/kWh).
- **Audit Logging**: Immutable event ledger tracking all admin actions, approvals, room allocations, and payment updates.

### 🏠 2. Tenant Resident Portal
- **Smart 30-Day Due Date**: Database-driven dynamic next due date automatically calculated from the tenant's date of joining (+30 days) and rolled forward after settled payments.
- **Payment Ledger & Receipts**: View digital invoice receipts with transaction IDs, mode of payment, and payment status (`PAID`, `PARTIAL`, `PENDING`).
- **Profile & KYC Document Dropzone**: Secure multi-part file uploads for Aadhaar cards and profile avatars.

### 📧 3. Automated Rent Reminder Engine
- **Spring `@Scheduled` Daily Cron**: Scans the PostgreSQL database every morning for active tenants whose 30-day rent cycle is due.
- **Gmail SMTP Integration**: Sends dark luxury styled email notifications with suite numbers, due dates, and one-click portal links.
- **Idempotent Anti-Spam Protection**: Prevents duplicate email dispatches on the same calendar day.

---

## 🏗️ Architecture & Tech Stack

```
Rent-Management-System-v1/
├── rent-management-backend/     # Spring Boot REST API
│   ├── src/main/java/           # Controllers, Entities, Services, Security
│   ├── src/main/resources/      # application.properties
│   ├── Dockerfile               # Multi-stage Java 25 JRE Docker build
│   └── pom.xml                  # Maven dependencies
│
├── rent-management-frontend/    # Next.js 16 Web Application
│   ├── src/app/                 # Next.js App Router (Admin & Tenant views)
│   ├── src/components/          # Reusable UI components & dialogs
│   ├── Dockerfile               # Next.js standalone optimized image
│   └── package.json             # NPM dependencies
│
├── docker-compose.yml           # Multi-container orchestration (DB + API + UI)
├── docker-build-push.bat        # 1-Click Docker Hub builder & uploader
├── DOCKER_README.md             # Docker deployment documentation
└── README.md                    # Project documentation
```

### Backend:
- **Language**: Java 25
- **Framework**: Spring Boot 4.1.1
- **Security**: Spring Security 6 with Stateless JWT Authentication
- **ORM / Database**: Spring Data JPA / Hibernate with PostgreSQL 16
- **Mailing**: Spring Mail with Gmail SMTP
- **Build Tool**: Maven

### Frontend:
- **Framework**: Next.js 16.3 (Turbopack, Server & Client Components)
- **UI & State**: React 19, TypeScript 5
- **Styling**: Tailwind CSS, Material Symbols Icons
- **Animations**: Framer Motion

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 21+** (or Java 25)
- **Maven 3.9+**
- **Node.js 20+** and **npm**
- **PostgreSQL 16** (or Docker)

---

### Method 1: Run with Docker Compose (Fastest)

Start PostgreSQL, Backend, and Frontend all together:

```bash
# Clone the repository
git clone https://github.com/krishna0529/Rent_Managements_System.git
cd Rent_Managements_System

# Start all containers in background
docker compose up -d
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL**: `localhost:5432` (`user: postgres`, `password: root`, `db: rent_management_db`)

---

### Method 2: Run Locally (Development Mode)

#### 1. Setup Database
Create a PostgreSQL database named `rent_management_db`:
```sql
CREATE DATABASE rent_management_db;
```

#### 2. Start Backend API
```bash
cd rent-management-backend

# Configure your database credentials in src/main/resources/application.properties if different:
# spring.datasource.username=postgres
# spring.datasource.password=root

# Run Spring Boot
mvn spring-boot:run
```
The backend will boot on `http://localhost:8080`.

#### 3. Start Frontend UI
```bash
cd rent-management-frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Hub Pre-Built Images

Pre-built, production-ready images are published on Docker Hub:

| Service | Docker Hub Image | Size |
| :--- | :--- | :--- |
| **Backend API** | `agroxgamerzz/rent-app-backend:latest` | ~132 MB |
| **Frontend UI** | `agroxgamerzz/rent-app-frontend:latest` | ~64.8 MB |
| **Full App** | `agroxgamerzz/rent-app:latest` | ~132 MB |

Pull and run directly:
```bash
docker run -d -p 8080:8080 agroxgamerzz/rent-app-backend:latest
docker run -d -p 3000:3000 agroxgamerzz/rent-app-frontend:latest
```

---

## 🔐 Default Environment & Credentials

| Setting | Default Value | Notes |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/rent_management_db` | Configurable |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | |
| `SPRING_DATASOURCE_PASSWORD` | `root` | |
| `PORT (Backend)` | `8080` | REST API |
| `PORT (Frontend)` | `3000` | Web Interface |
| `JWT Secret` | Pre-configured in properties | Replace in production |

---

## 📡 Key REST API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Tenant registration with KYC documents
- `POST /api/auth/login` - Tenant login (returns JWT token)
- `POST /api/admin/auth/login` - Admin credentials authentication

### 📊 Dashboard & Telemetry (`/api/admin/dashboard`)
- `GET /api/admin/dashboard/analytics?period=...` - Period-filtered analytics KPI summary
- `GET /api/admin/dashboard/export-csv?period=...` - Download Excel-compatible CSV report

### ⚡ Electricity Billing (`/api/admin/bills`)
- `POST /api/admin/bills/generate` - Generate electricity bill from meter readings
- `GET /api/admin/bills` - List all historical utility bills

### 💳 Payments (`/api/admin/payments`)
- `GET /api/admin/payments` - Retrieve complete payment ledger
- `POST /api/admin/payments/{id}/mark-paid` - Update settlement status

### 🔔 Notifications (`/api/notifications`)
- `POST /api/notifications/trigger-due-reminders` - Run due date scanner manually
- `POST /api/notifications/send-tenant-reminder/{userId}` - Dispatch reminder email to specific tenant

---

## 👥 Authors & Contributors

- **Krishnapratap Singh** ([@krishna0529](https://github.com/krishna0529)) - Project Lead & Developer

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
