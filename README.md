# SiNusa - Santri & Wali Santri Information System

A comprehensive Islamic boarding school management system that digitizes administration, provides transparency for parents, and improves operational efficiency.

## 🎯 Overview

SiNusa integrates all boarding school data into one secure, easy-to-use mobile and web application. The system manages santri data, finances, administration, and academics with real-time access for all stakeholders.

## 🏗️ Architecture

- **Mobile App**: Flutter (Android 8+, iOS 14+)
- **Backend API**: Node.js with Express
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with OTP verification
- **Payment Gateway**: Integration with multiple providers
- **File Storage**: Cloud storage for documents and images

## 👥 User Roles

1. **Santri** - Students with access to pocket money, savings, report cards, attendance
2. **Wali Santri** - Parents/guardians with payment and monitoring capabilities
3. **Admin/Staff** - Boarding school staff for data management
4. **Finance** - Treasurer for financial operations
5. **Super Admin** - Foundation-level management and audit access

## 🚀 Key Features

- 💰 Pocket Money Management
- 📋 Bills & Installments
- 💳 Payment Processing
- 📊 Attendance Tracking
- 📚 Learning History & Report Cards
- 📖 Digital Library
- 💸 Savings Management
- 🕌 Digital Infaq
- 📢 Announcements
- 💬 Feedback System
- 🏆 Achievement Records (CPS)
- 👤 Santri Profiles
- 🌐 Web Portal Integration

## 📁 Project Structure

```
sinusa/
├── mobile/                 # Flutter mobile application
├── backend/                # Node.js API server
├── web/                    # React web portal
├── docs/                   # Documentation
├── docker/                 # Docker configuration
└── scripts/                # Deployment scripts
```

## 🛠️ Technology Stack

### Mobile (Flutter)
- Flutter 3.x
- Dart 3.x
- Provider for state management
- Dio for HTTP requests
- Hive for local storage
- Flutter Secure Storage

### Backend (Node.js)
- Express.js
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT authentication
- Multer for file uploads
- Nodemailer for notifications

### Web Portal (React)
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Router

## 🔒 Security Features

- OTP-based authentication
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Audit trail for all transactions
- Session management with device binding
- API rate limiting

## 📊 Performance Requirements

- API response time: < 500ms
- Mobile app loading: < 2 seconds
- Support for 5,000+ simultaneous users
- 99% uptime SLA
- Offline-first architecture for critical data

## 🚀 Getting Started

See individual README files in each directory for setup instructions:
- [Mobile App Setup](./mobile/README.md)
- [Backend API Setup](./backend/README.md)
- [Web Portal Setup](./web/README.md)

## 📄 License

This project is proprietary software for Islamic boarding school management.
