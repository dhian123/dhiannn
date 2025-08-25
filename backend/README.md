# SiNusa Backend API

Backend API server for the SiNusa Islamic Boarding School Management System.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with OTP verification
- **Role-Based Access Control**: Multiple user roles (Santri, Wali Santri, Admin, Finance, Super Admin)
- **Financial Management**: Pocket money, savings, bills, and payment processing
- **Academic Management**: Attendance tracking, report cards, achievements
- **Library Management**: Book borrowing, returns, fines
- **Communication**: Announcements, notifications, feedback system
- **Audit Trail**: Comprehensive logging of all system activities
- **File Management**: Document upload and storage
- **Payment Integration**: Multiple payment gateway support

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + OTP (Twilio SMS)
- **Caching**: Redis
- **File Upload**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Payment**: Midtrans integration
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- Twilio account (for SMS OTP)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

### Optional Variables
- `REDIS_URL`: Redis connection string
- `MIDTRANS_*`: Payment gateway configuration
- `SMTP_*`: Email configuration
- `AWS_*`: Cloud storage configuration

## 📊 Database Schema

The application uses Prisma ORM with the following main entities:

- **Users**: Authentication and role management
- **Santri**: Student information and profiles
- **WaliSantri**: Parent/guardian information
- **PocketMoney**: Student pocket money management
- **Savings**: Student savings accounts
- **Bills**: Monthly bills and installments
- **Payments**: Payment transactions
- **Attendance**: Student attendance tracking
- **ReportCards**: Academic performance records
- **Library**: Book management and loans
- **Achievements**: Student achievements (CPS)
- **Announcements**: System announcements
- **Notifications**: User notifications
- **AuditLogs**: System audit trail

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - User logout

### Santri Management
- `GET /api/santri` - Get santri list
- `GET /api/santri/:id` - Get santri details
- `POST /api/santri` - Create santri
- `PUT /api/santri/:id` - Update santri
- `DELETE /api/santri/:id` - Delete santri

### Pocket Money
- `GET /api/pocket-money/:santriId` - Get pocket money balance
- `GET /api/pocket-money/:santriId/transactions` - Get transaction history
- `POST /api/pocket-money/:santriId/top-up` - Top up pocket money
- `POST /api/pocket-money/:santriId/withdraw` - Withdraw pocket money

### Bills & Payments
- `GET /api/bills` - Get bills list
- `GET /api/bills/:id` - Get bill details
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get payment history

### Attendance
- `GET /api/attendance/:santriId` - Get attendance records
- `POST /api/attendance` - Record attendance
- `PUT /api/attendance/:id` - Update attendance

### Academic
- `GET /api/report-cards/:santriId` - Get report cards
- `POST /api/report-cards` - Upload report card
- `GET /api/achievements/:santriId` - Get achievements

### Library
- `GET /api/library/books` - Get books list
- `POST /api/library/books` - Add book
- `POST /api/library/borrow` - Borrow book
- `POST /api/library/return` - Return book

### Communication
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement
- `GET /api/notifications` - Get notifications
- `POST /api/feedback` - Submit feedback

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Two-factor authentication via SMS
- **Role-Based Access Control**: Granular permissions per user role
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete audit trail of all actions
- **Data Encryption**: Sensitive data encryption at rest
- **Session Management**: Secure session handling

## 📝 API Documentation

### Request Format
All API requests should include:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

### Response Format
Standard response format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // for paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="auth"
```

## 📦 Deployment

### Docker Deployment
```bash
# Build image
docker build -t sinusa-backend .

# Run container
docker run -p 3000:3000 --env-file .env sinusa-backend
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## 🔍 Monitoring & Logging

- **Health Check**: `GET /health`
- **Logs**: Winston logging with file rotation
- **Audit Trail**: Complete audit logging
- **Error Tracking**: Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software for Islamic boarding school management.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v1.0.0 (Initial Release)
- Complete authentication system
- Financial management features
- Academic tracking
- Library management
- Communication system
- Audit trail implementation