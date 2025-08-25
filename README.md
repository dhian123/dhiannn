# SiNusa Application
## Santri & Wali Santri Information System

A comprehensive Islamic boarding school management system with mobile app and web dashboard.

## 🏗️ Architecture

### Mobile App (Flutter)
- **Target**: Android 8+ and iOS 14+
- **Features**: Offline-first architecture with real-time sync
- **Authentication**: OTP-based login with role-based access control

### Backend API (Node.js/Express)
- **Database**: PostgreSQL with Redis for caching
- **Security**: JWT tokens, encryption, audit trails
- **Payment**: Integration with payment gateways
- **Performance**: API response < 500ms, 99% SLA

### Web Dashboard
- **Admin Panel**: Staff and admin management interface
- **Reports**: Financial reports, attendance, academic records
- **Real-time**: WebSocket integration for live updates

## 👥 User Roles

1. **Santri** - View balance, grades, attendance, library
2. **Wali Santri** - Top-up money, pay bills, monitor children
3. **Admin/Staff** - Manage santri data, attendance, grades
4. **Finance** - Handle bills, payments, reconciliation
5. **Super Admin** - User management, audit, reports

## 🚀 Core Features

- 💰 **Pocket Money Management** - Top-up, transactions, balance
- 📋 **Bills & Installments** - Monthly payments, status tracking
- 📊 **Payment History** - Complete transaction records
- 📅 **Attendance System** - Class and activity tracking
- 📚 **Academic Records** - Grades, report cards, learning history
- 📖 **Library Management** - Book borrowing, returns, fines
- 💵 **Santri Savings** - Balance management, deposits, withdrawals
- 🎁 **Infaq System** - Digital donations
- 📢 **Announcements** - Notifications and archives
- 💬 **Feedback System** - Critiques and suggestions
- 🏆 **Achievement Records** - Academic and non-academic achievements
- 👤 **Santri Profiles** - Personal data and administrative history

## 🛠️ Development Setup

### Prerequisites
- Flutter SDK 3.0+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Quick Start
```bash
# Backend setup
cd backend
npm install
npm run dev

# Mobile app setup
cd mobile
flutter pub get
flutter run
```

## 📱 Mobile App Structure
```
mobile/
├── lib/
│   ├── core/           # Core utilities, constants
│   ├── data/           # Data layer (repositories, models)
│   ├── domain/         # Business logic layer
│   ├── presentation/   # UI layer (screens, widgets)
│   └── main.dart
├── assets/            # Images, fonts, etc.
└── pubspec.yaml
```

## 🔧 Backend Structure
```
backend/
├── src/
│   ├── controllers/    # API route handlers
│   ├── models/        # Database models
│   ├── middleware/    # Authentication, validation
│   ├── services/      # Business logic
│   ├── routes/        # API routes
│   └── utils/         # Utilities, helpers
├── config/            # Database, environment config
└── package.json
```

## 🔒 Security Features

- OTP-based authentication
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Audit trail for all transactions
- Session management with device binding
- Idempotency keys for financial operations

## 📊 Performance & Scalability

- Offline-first mobile architecture
- Redis caching for frequently accessed data
- Database indexing and query optimization
- Load balancing ready
- Supports 5,000+ concurrent users
- Auto-scaling capabilities

## 🧪 Testing Strategy

- Unit tests for business logic
- Integration tests for API endpoints
- Widget tests for Flutter UI
- End-to-end testing for critical user flows
- Performance testing for scalability

## 📈 Monitoring & Analytics

- Application performance monitoring
- Real-time error tracking
- User analytics and behavior tracking
- Financial transaction monitoring
- System health dashboards

## 🚀 Deployment

- Docker containerization
- CI/CD pipeline with automated testing
- Blue-green deployment strategy
- Database migration management
- Environment-specific configurations

## 📄 License

Copyright © 2025 Islamic Boarding School Foundation. All rights reserved.