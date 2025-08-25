# SiNusa - Islamic Boarding School Management System

Complete documentation for the SiNusa application, a comprehensive Islamic boarding school management system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [System Requirements](#system-requirements)
4. [Installation Guide](#installation-guide)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [User Guides](#user-guides)
9. [Development Guide](#development-guide)
10. [Deployment Guide](#deployment-guide)
11. [Security](#security)
12. [Troubleshooting](#troubleshooting)

## 🎯 Overview

SiNusa is a comprehensive Islamic boarding school management system designed to digitize and streamline all aspects of boarding school operations. The system provides real-time access to financial, academic, and administrative data for all stakeholders.

### Key Features

- **Multi-role Access**: Santri, Wali Santri, Admin, Finance, Super Admin
- **Financial Management**: Pocket money, savings, bills, payments
- **Academic Tracking**: Attendance, report cards, achievements
- **Library Management**: Book borrowing, returns, fines
- **Communication**: Announcements, notifications, feedback
- **Security**: OTP authentication, role-based access, audit trails

### Technology Stack

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Mobile**: Flutter, Dart, Riverpod
- **Web**: React, TypeScript, Tailwind CSS
- **Authentication**: JWT, OTP (Twilio)
- **Payment**: Midtrans integration
- **Notifications**: Firebase Cloud Messaging

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Portal    │    │   Admin Panel   │
│   (Flutter)     │    │   (React)       │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Express)     │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   File Storage  │
│   (Database)    │    │   (Cache)       │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

#### Backend (Node.js/Express)
- **API Layer**: RESTful API endpoints
- **Service Layer**: Business logic implementation
- **Data Layer**: Database operations with Prisma ORM
- **Middleware**: Authentication, validation, error handling
- **Utilities**: Logging, caching, file handling

#### Mobile App (Flutter)
- **UI Layer**: Material Design 3 components
- **State Management**: Riverpod providers
- **Service Layer**: API communication, local storage
- **Navigation**: Go Router for screen management
- **Utilities**: Offline support, biometric auth

#### Web Portal (React)
- **UI Layer**: React components with Tailwind CSS
- **State Management**: React Query + Zustand
- **Service Layer**: API integration
- **Routing**: React Router
- **Utilities**: Form handling, file uploads

## 💻 System Requirements

### Development Environment
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Redis**: 6.0 or higher
- **Flutter**: 3.10.0 or higher
- **Dart**: 3.0.0 or higher
- **Git**: Latest version

### Production Environment
- **Server**: Ubuntu 20.04 LTS or higher
- **CPU**: 2 cores minimum, 4 cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum SSD
- **Network**: Stable internet connection

### Mobile Requirements
- **Android**: API 21+ (Android 5.0+)
- **iOS**: iOS 14.0+
- **RAM**: 2GB minimum
- **Storage**: 100MB available space

## 🔧 Installation Guide

### 1. Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd sinusa/backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### 2. Mobile App Setup

```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
flutter pub get

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Run the app
flutter run
```

### 3. Web Portal Setup

```bash
# Navigate to web directory
cd ../web

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sinusa_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Twilio (SMS)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Redis
REDIS_URL="redis://localhost:6379"

# Payment Gateway
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"
```

#### Mobile (.env)
```env
# API
API_BASE_URL="http://localhost:3000/api"
API_TIMEOUT=30000

# Firebase
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"

# Payment
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
```

### Database Configuration

The system uses PostgreSQL with the following main tables:

- **users**: User authentication and profiles
- **santri**: Student information
- **pocket_money**: Pocket money accounts
- **savings**: Savings accounts
- **bills**: Monthly bills
- **payments**: Payment transactions
- **attendance**: Attendance records
- **report_cards**: Academic records
- **library_books**: Book catalog
- **announcements**: System announcements

## 📚 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "6281234567890",
  "password": "password123"
}
```

#### OTP Verification
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "6281234567890",
  "code": "123456",
  "type": "LOGIN"
}
```

### Financial Endpoints

#### Get Pocket Money Balance
```http
GET /api/pocket-money/{santriId}
Authorization: Bearer {token}
```

#### Top-up Pocket Money
```http
POST /api/pocket-money/{santriId}/top-up
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100000,
  "paymentMethod": "BANK_TRANSFER",
  "description": "Top-up pocket money"
}
```

### Academic Endpoints

#### Get Attendance
```http
GET /api/attendance/{santriId}?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

#### Record Attendance
```http
POST /api/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "santriId": "santri_id",
  "date": "2024-01-15",
  "type": "CLASS",
  "status": "PRESENT"
}
```

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role USER_ROLE DEFAULT 'SANTRI',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Santri Table
```sql
CREATE TABLE santri (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE REFERENCES users(id),
  nis VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  birth_place VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  gender GENDER NOT NULL,
  address TEXT NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(255) NOT NULL,
  entry_year INTEGER NOT NULL,
  current_class VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Pocket Money Table
```sql
CREATE TABLE pocket_money (
  id VARCHAR(255) PRIMARY KEY,
  santri_id VARCHAR(255) UNIQUE REFERENCES santri(id),
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 👥 User Guides

### For Santri (Students)

#### Getting Started
1. Download the SiNusa mobile app
2. Register with your NIS (Student ID)
3. Verify your phone number with OTP
4. Complete your profile information

#### Using Pocket Money
1. **Check Balance**: View your current balance on the dashboard
2. **Top-up**: Request top-up from your parent/guardian
3. **Withdraw**: Request withdrawal for approved purposes
4. **History**: View all transactions in the history tab

#### Academic Features
1. **Attendance**: View your daily attendance records
2. **Report Cards**: Access your academic performance
3. **Achievements**: Track your academic and non-academic achievements

### For Wali Santri (Parents/Guardians)

#### Financial Management
1. **Top-up Pocket Money**: Transfer money to your child's account
2. **Pay Bills**: Pay monthly bills and installments
3. **View Transactions**: Monitor all financial activities
4. **Set Limits**: Configure spending limits for your child

#### Academic Monitoring
1. **Attendance Tracking**: Monitor your child's attendance
2. **Academic Performance**: View report cards and grades
3. **Achievements**: Track academic and non-academic achievements
4. **Communication**: Receive announcements and updates

### For Admin/Staff

#### Student Management
1. **Add Students**: Register new students in the system
2. **Update Information**: Modify student details and profiles
3. **Attendance Recording**: Record daily attendance
4. **Academic Records**: Upload and manage report cards

#### Financial Management
1. **Bill Generation**: Create monthly bills for students
2. **Payment Tracking**: Monitor payment status
3. **Financial Reports**: Generate financial reports
4. **Refund Processing**: Handle refund requests

### For Finance Staff

#### Payment Processing
1. **Payment Verification**: Verify incoming payments
2. **Reconciliation**: Reconcile payments with bank statements
3. **Financial Reports**: Generate comprehensive financial reports
4. **Audit Trail**: Maintain complete audit records

## 👨‍💻 Development Guide

### Code Structure

#### Backend Structure
```
backend/
├── src/
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── utils/           # Utility functions
│   └── database/        # Database operations
├── prisma/              # Database schema
├── logs/               # Application logs
└── tests/              # Test files
```

#### Mobile App Structure
```
mobile/
├── lib/
│   ├── core/           # Core functionality
│   ├── features/       # Feature modules
│   ├── shared/         # Shared components
│   └── main.dart       # App entry point
├── assets/             # Images, fonts, etc.
└── test/              # Test files
```

### Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes
   # Test changes
   # Commit changes
   git commit -m "Add new feature"
   
   # Push to remote
   git push origin feature/new-feature
   ```

2. **Code Review**
   - Create pull request
   - Request code review
   - Address feedback
   - Merge to main branch

3. **Testing**
   ```bash
   # Backend tests
   npm test
   
   # Mobile tests
   flutter test
   
   # Integration tests
   flutter test integration_test/
   ```

### Best Practices

#### Code Style
- Follow language-specific style guides
- Use meaningful variable and function names
- Add comprehensive comments
- Keep functions small and focused

#### Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Log security events

#### Performance
- Use caching where appropriate
- Optimize database queries
- Implement pagination
- Monitor performance metrics

## 🚀 Deployment Guide

### Production Deployment

#### Backend Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Redis
   sudo apt install redis-server
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd sinusa/backend
   
   # Install dependencies
   npm install --production
   
   # Environment setup
   cp .env.example .env
   # Configure production environment
   
   # Database migration
   npm run db:migrate
   
   # Start application
   npm start
   ```

3. **Process Management**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application with PM2
   pm2 start src/server.js --name "sinusa-backend"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

#### Mobile App Deployment

1. **Android Deployment**
   ```bash
   # Build app bundle
   flutter build appbundle --release
   
   # Sign the bundle
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
     -keystore ~/upload-keystore.jks \
     build/app/outputs/bundle/release/app-release.aab \
     upload
   
   # Upload to Google Play Console
   ```

2. **iOS Deployment**
   ```bash
   # Build IPA
   flutter build ipa --release
   
   # Archive in Xcode
   # Upload to App Store Connect
   ```

### Monitoring and Maintenance

#### Health Checks
- Monitor API endpoints
- Check database connectivity
- Verify payment gateway status
- Monitor server resources

#### Backup Strategy
- Daily database backups
- Weekly full system backups
- Off-site backup storage
- Regular backup testing

#### Security Updates
- Regular security patches
- Dependency updates
- SSL certificate renewal
- Security audit reviews

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **OTP Verification**: Two-factor authentication via SMS
- **Role-based Access**: Granular permissions per user role
- **Session Management**: Secure session handling

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

### Network Security
- **HTTPS**: All communications encrypted
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Proper Cross-Origin Resource Sharing configuration
- **Firewall**: Network-level security controls

### Audit & Compliance
- **Audit Logging**: Complete audit trail of all actions
- **Data Retention**: Proper data retention policies
- **Privacy Protection**: GDPR-compliant data handling
- **Regular Audits**: Security and compliance audits

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

**Database Connection Error**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Redis Connection Error**
```bash
# Check Redis service
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

**Payment Gateway Issues**
```bash
# Check Midtrans configuration
echo $MIDTRANS_SERVER_KEY
echo $MIDTRANS_CLIENT_KEY

# Test payment endpoint
curl -X POST https://api.midtrans.com/v2/charge \
  -H "Authorization: Basic $MIDTRANS_SERVER_KEY" \
  -H "Content-Type: application/json"
```

#### Mobile App Issues

**Build Errors**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Check Flutter version
flutter --version

# Update Flutter
flutter upgrade
```

**API Connection Issues**
```bash
# Check API URL configuration
# Verify network connectivity
# Check SSL certificates
```

### Performance Issues

#### Slow API Responses
- Check database query performance
- Review caching implementation
- Monitor server resources
- Optimize database indexes

#### Mobile App Performance
- Check image optimization
- Review state management
- Monitor memory usage
- Optimize network requests

### Support Resources

- **Documentation**: This comprehensive guide
- **Issue Tracker**: GitHub issues
- **Community**: Developer community forum
- **Support Email**: support@sinusa.com

## 📞 Contact & Support

### Development Team
- **Lead Developer**: [Contact Information]
- **Backend Developer**: [Contact Information]
- **Mobile Developer**: [Contact Information]
- **UI/UX Designer**: [Contact Information]

### Support Channels
- **Email**: support@sinusa.com
- **Phone**: +62-xxx-xxx-xxxx
- **WhatsApp**: +62-xxx-xxx-xxxx
- **Documentation**: [Documentation URL]

### Emergency Contacts
- **Technical Issues**: tech-support@sinusa.com
- **Security Issues**: security@sinusa.com
- **Business Inquiries**: business@sinusa.com

---

**SiNusa - Empowering Islamic Education Through Technology**

*Version 1.0.0 | Last Updated: January 2025*