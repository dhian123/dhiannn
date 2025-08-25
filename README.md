# SiNusa - Santri & Wali Santri Information System

A comprehensive digital platform for Islamic boarding school management, providing transparency and efficiency for santri, wali santri, and boarding school staff.

## 🎯 Overview

SiNusa integrates all boarding school data into one secure, easy-to-use mobile and web application, solving the challenges of manual data management and scattered information systems.

## 🏗️ Architecture

```
sinusa/
├── backend/                 # Node.js/Express API
├── mobile/                  # Flutter mobile app
├── web/                     # React web portal
├── docs/                    # Documentation
├── docker/                  # Docker configuration
└── scripts/                 # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Flutter 3.0+
- PostgreSQL 14+
- Docker & Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sinusa
   ```

2. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Mobile App Setup**
   ```bash
   cd mobile
   flutter pub get
   flutter run
   ```

5. **Web Portal Setup**
   ```bash
   cd web
   npm install
   npm start
   ```

## 📱 Features

### For Santri
- Pocket money balance & transactions
- Attendance tracking
- Report cards & learning history
- Library management
- Savings account
- Achievement records (CPS)

### For Wali Santri
- Top-up pocket money
- Bill payments & installments
- Real-time monitoring
- Announcements
- Feedback system

### For Admin/Staff
- Student data management
- Financial reports
- Attendance management
- Library administration
- System announcements

### For Finance
- Payment processing
- Reconciliation
- Financial reporting
- Audit trails

## 🔒 Security Features

- OTP-based authentication
- Role-based access control (RBAC)
- Data encryption
- Session management
- Audit logging
- Device binding

## 📊 Non-Functional Requirements

- **Reliability**: 99% SLA
- **Performance**: API < 500ms, Mobile < 2s
- **Scalability**: 5,000+ concurrent users
- **Offline Support**: Critical data cached locally
- **Compatibility**: Android 8+, iOS 14+

## 🛠️ Tech Stack

### Backend
- Node.js/Express
- TypeScript
- PostgreSQL
- Redis (caching)
- JWT Authentication
- WebSocket (Socket.io)

### Mobile
- Flutter
- Dart
- SQLite (local storage)
- HTTP/WebSocket clients

### Web
- React
- TypeScript
- Material-UI
- Redux Toolkit

### Infrastructure
- Docker
- Nginx
- PM2
- AWS/GCP ready

## 📄 License

This project is proprietary software for Islamic boarding schools.

## 🤝 Contributing

Please refer to the development guidelines in the `docs/` directory.
