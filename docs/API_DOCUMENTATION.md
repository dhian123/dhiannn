# SiNusa API Documentation

## Overview

The SiNusa API is a RESTful service that provides comprehensive functionality for Islamic boarding school management. This API supports multiple user roles including Santri, Wali Santri, Admin, Finance, and Super Admin.

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.sinusa.com/api/v1`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **OTP**: 3 requests per 15 minutes
- **Payments**: 10 requests per hour

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "santri",
      "permissions": ["view_pocket_money", "view_attendance"],
      "avatar": "https://example.com/avatar.jpg",
      "email_verified": true
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": "7d"
    }
  },
  "message": "Login successful"
}
```

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "+6281234567890",
  "role": "santri"
}
```

#### POST /auth/send-otp
Send OTP to phone number.

**Request Body:**
```json
{
  "phone": "+6281234567890"
}
```

#### POST /auth/verify-otp
Verify OTP and login/register.

**Request Body:**
```json
{
  "phone": "+6281234567890",
  "otp": "123456"
}
```

#### POST /auth/refresh-token
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### POST /auth/logout
Logout user.

**Headers:**
```
Authorization: Bearer <token>
```

### User Management

#### GET /users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /users/me
Update current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+6281234567890",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

### Pocket Money

#### GET /pocket-money/balance
Get pocket money balance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 50000,
    "currency": "IDR",
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /pocket-money/transactions
Get transaction history.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `type` (string): Transaction type (topup, withdrawal, transfer)
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)

#### POST /pocket-money/topup
Top up pocket money.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 100000,
  "paymentMethod": "bank_transfer",
  "bankCode": "bca"
}
```

### Bills & Payments

#### GET /bills
Get bills list.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string): Bill status (pending, paid, overdue)
- `month` (string): Month (YYYY-MM format)
- `year` (number): Year

#### GET /bills/:id
Get bill details.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /bills/:id/pay
Pay bill.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 500000,
  "paymentMethod": "bank_transfer",
  "bankCode": "bca"
}
```

### Attendance

#### GET /attendance
Get attendance records.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` (string): Date (YYYY-MM-DD format)
- `month` (string): Month (YYYY-MM format)
- `status` (string): Attendance status (present, absent, late)

#### POST /attendance
Mark attendance (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "date": "2025-01-01",
  "status": "present",
  "notes": "Optional notes"
}
```

### Report Cards

#### GET /report-cards
Get report cards.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `semester` (string): Semester (1, 2)
- `year` (number): Academic year
- `subject` (string): Subject filter

#### GET /report-cards/:id
Get specific report card.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /report-cards
Create report card (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "semester": 1,
  "year": 2025,
  "subjects": [
    {
      "name": "Mathematics",
      "score": 85,
      "grade": "A"
    }
  ],
  "averageScore": 85.5,
  "rank": 5,
  "totalStudents": 30
}
```

### Library

#### GET /library/books
Get books list.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (string): Search term
- `category` (string): Book category
- `available` (boolean): Available books only

#### GET /library/transactions
Get borrowing history.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /library/borrow
Borrow book.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "bookId": "book-uuid",
  "returnDate": "2025-01-15"
}
```

### Savings

#### GET /savings/balance
Get savings balance.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET /savings/transactions
Get savings transactions.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /savings/deposit
Deposit to savings.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 100000,
  "notes": "Monthly deposit"
}
```

#### POST /savings/withdraw
Withdraw from savings.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 50000,
  "reason": "Emergency withdrawal"
}
```

### Infaq

#### GET /infaq
Get infaq records.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /infaq
Make infaq donation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 10000,
  "category": "general",
  "notes": "Optional notes",
  "anonymous": false
}
```

### Announcements

#### GET /announcements
Get announcements.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `category` (string): Announcement category

#### POST /announcements
Create announcement (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Important Announcement",
  "content": "Announcement content",
  "category": "general",
  "priority": "high",
  "targetRoles": ["santri", "wali_santri"]
}
```

### Feedback

#### GET /feedback
Get feedback (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /feedback
Submit feedback.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "suggestion",
  "subject": "Feedback subject",
  "message": "Feedback message",
  "priority": "medium"
}
```

### CPS (Santri Achievement Record)

#### GET /cps
Get CPS records.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /cps
Add CPS record (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "achievement": "First Place in Science Olympiad",
  "category": "academic",
  "level": "national",
  "date": "2025-01-01",
  "description": "Achievement description"
}
```

### Warid (Santri Personal Data)

#### GET /warid
Get Warid data.

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /warid
Update Warid data (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "personalData": {
    "birthPlace": "Jakarta",
    "birthDate": "2005-01-01",
    "address": "Complete address",
    "parentName": "Parent Name",
    "parentPhone": "+6281234567890"
  }
}
```

### Notifications

#### GET /notifications
Get notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `read` (boolean): Read status filter

#### PUT /notifications/:id/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

### Admin Endpoints

#### GET /admin/users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (string): Filter by role
- `search` (string): Search term
- `page` (number): Page number
- `limit` (number): Items per page

#### PUT /admin/users/:id
Update user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

#### GET /admin/reports
Get system reports (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (string): Report type (financial, attendance, academic)
- `startDate` (string): Start date
- `endDate` (string): End date

### Finance Endpoints

#### GET /finance/payments
Get payment records (Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /finance/payments/reconcile
Reconcile payments (Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "paymentId": "payment-uuid",
  "status": "confirmed",
  "notes": "Reconciliation notes"
}
```

## WebSocket Events

### Connection
Connect to WebSocket with authentication:

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### notification
Receive real-time notifications.

```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

#### realtime:update
Receive real-time updates.

```javascript
socket.on('realtime:update', (data) => {
  console.log('Real-time update:', data);
});
```

#### data:request
Request real-time data.

```javascript
socket.emit('data:request', {
  type: 'pocket_money_balance',
  params: {}
});
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `TOKEN_EXPIRED` | JWT token expired |
| `INVALID_TOKEN` | Invalid JWT token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `USER_NOT_FOUND` | User not found |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_ENTRY` | Duplicate entry detected |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `PAYMENT_FAILED` | Payment processing failed |
| `INVALID_OTP` | Invalid OTP code |
| `EMAIL_NOT_VERIFIED` | Email not verified |

## Pagination

Most list endpoints support pagination with the following parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## File Upload

For file uploads, use multipart/form-data:

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'avatar');

fetch('/api/v1/users/avatar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## Testing

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Authentication Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @sinusa/api-client
```

```javascript
import { SiNusaClient } from '@sinusa/api-client';

const client = new SiNusaClient({
  baseURL: 'http://localhost:3000/api/v1',
  token: 'your-jwt-token'
});

// Get pocket money balance
const balance = await client.pocketMoney.getBalance();
```

### Flutter/Dart
```yaml
dependencies:
  sinusa_api: ^1.0.0
```

```dart
import 'package:sinusa_api/sinusa_api.dart';

final client = SiNusaClient(
  baseUrl: 'http://localhost:3000/api/v1',
  token: 'your-jwt-token',
);

final balance = await client.pocketMoney.getBalance();
```

## Support

For API support and questions:
- Email: api-support@sinusa.com
- Documentation: https://docs.sinusa.com
- GitHub: https://github.com/sinusa/api
