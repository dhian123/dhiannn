# SiNusa Mobile App

Flutter mobile application for the SiNusa Islamic Boarding School Management System.

## 🚀 Features

### Authentication & Security
- **OTP-based Login**: Secure two-factor authentication via SMS
- **Biometric Authentication**: Fingerprint/Face ID support
- **Session Management**: Automatic token refresh and secure storage
- **Role-based Access**: Different interfaces for Santri, Wali Santri, Admin, Finance

### Financial Management
- **Pocket Money**: Real-time balance, top-up, withdrawal, transaction history
- **Savings Account**: Balance tracking, deposits, withdrawals
- **Bills & Payments**: Monthly bills, payment status, payment gateway integration
- **Infaq Donations**: Digital donation system with flexible amounts

### Academic Management
- **Attendance Tracking**: Daily attendance for classes, prayers, activities
- **Report Cards**: View academic performance and download PDF reports
- **Achievements (CPS)**: Track academic and non-academic achievements
- **Learning History**: Complete academic record

### Library Management
- **Book Catalog**: Browse available books by category
- **Borrowing System**: Borrow and return books with due date tracking
- **Fines Management**: Automatic fine calculation for overdue books
- **Reading History**: Track borrowed books and reading progress

### Communication
- **Announcements**: Real-time notifications and announcements
- **Push Notifications**: Instant updates for important events
- **Feedback System**: Submit suggestions, complaints, and questions
- **In-app Messaging**: Direct communication with boarding school staff

### Additional Features
- **Offline Support**: Critical data available offline
- **Multi-language**: Support for Indonesian and English
- **Dark Mode**: Complete dark theme support
- **Accessibility**: Screen reader support and accessibility features

## 🛠️ Technology Stack

- **Framework**: Flutter 3.x
- **Language**: Dart 3.x
- **State Management**: Riverpod
- **Navigation**: Go Router
- **HTTP Client**: Dio with Retrofit
- **Local Storage**: Hive + Flutter Secure Storage
- **UI Components**: Material Design 3
- **Charts**: FL Chart + Syncfusion Charts
- **Notifications**: Firebase Cloud Messaging
- **Authentication**: Local Auth (Biometric)
- **File Handling**: File Picker + Image Picker
- **PDF**: PDF generation and viewing
- **QR Code**: QR generation and scanning

## 📋 Prerequisites

- Flutter SDK 3.10.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / VS Code
- Android SDK (API level 21+)
- iOS 14.0+ (for iOS development)
- Firebase project setup
- Backend API running

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Environment setup**
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Firebase setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase
   firebase init
   
   # Add your Firebase configuration
   # Download google-services.json (Android) and GoogleService-Info.plist (iOS)
   ```

5. **Run the app**
   ```bash
   # Development
   flutter run
   
   # Production build
   flutter build apk --release
   flutter build ios --release
   ```

## 🔐 Environment Configuration

Create a `.env` file with the following variables:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Payment Gateway
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_MERCHANT_BASE_URL=https://api.midtrans.com

# Feature Flags
ENABLE_BIOMETRIC=true
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=true

# App Configuration
APP_NAME=SiNusa
APP_VERSION=1.0.0
DEFAULT_LANGUAGE=id
```

## 📱 App Structure

```
lib/
├── core/                    # Core functionality
│   ├── constants/          # App constants
│   ├── theme/              # App theme and styling
│   ├── routes/             # Navigation routes
│   ├── providers/          # State management
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── widgets/            # Reusable widgets
├── features/               # Feature modules
│   ├── auth/              # Authentication
│   ├── dashboard/         # Main dashboard
│   ├── pocket_money/      # Pocket money management
│   ├── savings/           # Savings management
│   ├── bills/             # Bills and payments
│   ├── attendance/        # Attendance tracking
│   ├── academic/          # Academic features
│   ├── library/           # Library management
│   ├── announcements/     # Announcements
│   ├── notifications/     # Notifications
│   ├── feedback/          # Feedback system
│   └── profile/           # User profile
├── shared/                # Shared components
│   ├── models/            # Data models
│   ├── widgets/           # Shared widgets
│   └── extensions/        # Dart extensions
└── main.dart              # App entry point
```

## 🎨 UI/UX Design

### Design System
- **Material Design 3**: Latest Material Design guidelines
- **Custom Theme**: Islamic-themed color palette
- **Typography**: Poppins and Inter fonts
- **Icons**: Custom Islamic-themed icons
- **Animations**: Smooth transitions and micro-interactions

### Color Palette
- **Primary**: Blue (#1E3A8A) - Trust and professionalism
- **Secondary**: Green (#10B981) - Success and growth
- **Accent**: Orange (#F59E0B) - Energy and warmth
- **Error**: Red (#EF4444) - Error states
- **Success**: Green (#10B981) - Success states

### Responsive Design
- **Adaptive Layout**: Works on phones and tablets
- **Orientation Support**: Portrait and landscape modes
- **Accessibility**: Screen reader and accessibility support

## 🔒 Security Features

- **Secure Storage**: Sensitive data encrypted at rest
- **Network Security**: HTTPS-only API communication
- **Token Management**: Secure JWT token handling
- **Biometric Auth**: Local device authentication
- **Session Timeout**: Automatic session management
- **Data Validation**: Input sanitization and validation

## 📊 State Management

Using Riverpod for state management:

```dart
// Example provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

// Example usage
class LoginScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    
    return Scaffold(
      // UI implementation
    );
  }
}
```

## 🌐 API Integration

### HTTP Client Setup
```dart
final dio = Dio(BaseOptions(
  baseUrl: AppConstants.baseUrl,
  connectTimeout: AppConstants.apiTimeout,
  receiveTimeout: AppConstants.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
));
```

### API Service Example
```dart
@RestApi(baseUrl: AppConstants.baseUrl)
abstract class AuthService {
  factory AuthService(Dio dio) = _AuthService;

  @POST('/auth/login')
  Future<ApiResponse<LoginResponse>> login(@Body() LoginRequest request);

  @POST('/auth/verify-otp')
  Future<ApiResponse<VerifyOtpResponse>> verifyOtp(@Body() VerifyOtpRequest request);
}
```

## 📱 Platform Support

### Android
- **Minimum SDK**: API 21 (Android 5.0)
- **Target SDK**: API 34 (Android 14)
- **Permissions**: Camera, Storage, Location, Notifications
- **Features**: Biometric authentication, background sync

### iOS
- **Minimum Version**: iOS 14.0
- **Target Version**: iOS 17.0
- **Permissions**: Camera, Photo Library, Location, Notifications
- **Features**: Face ID, Touch ID, background app refresh

## 🧪 Testing

```bash
# Unit tests
flutter test

# Widget tests
flutter test test/widget_test.dart

# Integration tests
flutter test integration_test/

# Coverage report
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

## 📦 Building

### Android
```bash
# Debug build
flutter build apk --debug

# Release build
flutter build apk --release

# App bundle (recommended for Play Store)
flutter build appbundle --release
```

### iOS
```bash
# Debug build
flutter build ios --debug

# Release build
flutter build ios --release

# Archive for App Store
flutter build ipa --release
```

## 🚀 Deployment

### Google Play Store
1. Build app bundle: `flutter build appbundle --release`
2. Sign the bundle with your keystore
3. Upload to Google Play Console
4. Configure store listing and release

### Apple App Store
1. Build IPA: `flutter build ipa --release`
2. Archive in Xcode
3. Upload to App Store Connect
4. Configure app metadata and release

## 🔧 Development Guidelines

### Code Style
- Follow Dart style guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Architecture
- **Clean Architecture**: Separation of concerns
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: Using Riverpod providers
- **Error Handling**: Comprehensive error management

### Performance
- **Lazy Loading**: Load data on demand
- **Caching**: Cache frequently accessed data
- **Image Optimization**: Compress and cache images
- **Memory Management**: Dispose resources properly

## 🐛 Debugging

### Common Issues
1. **Build Errors**: Check Flutter and Dart versions
2. **API Errors**: Verify backend is running and accessible
3. **Permission Issues**: Check platform-specific permissions
4. **Firebase Issues**: Verify Firebase configuration

### Debug Tools
- **Flutter Inspector**: UI debugging
- **Network Inspector**: API debugging
- **Performance Profiler**: Performance analysis
- **Logs**: Comprehensive logging system

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
- Offline support
- Push notifications