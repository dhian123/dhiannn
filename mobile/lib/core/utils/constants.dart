class AppConstants {
  // App Information
  static const String appName = 'SiNusa';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Islamic Boarding School Management System';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000/api';
  static const String apiVersion = 'v1';
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration apiRetryDelay = Duration(seconds: 2);
  static const int maxRetries = 3;
  
  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String verifyOtpEndpoint = '/auth/verify-otp';
  static const String forgotPasswordEndpoint = '/auth/forgot-password';
  static const String resetPasswordEndpoint = '/auth/reset-password';
  static const String logoutEndpoint = '/auth/logout';
  
  // User Management
  static const String userProfileEndpoint = '/users/profile';
  static const String updateProfileEndpoint = '/users/profile';
  static const String changePasswordEndpoint = '/users/change-password';
  
  // Santri Management
  static const String santriEndpoint = '/santri';
  static const String santriProfileEndpoint = '/santri/profile';
  
  // Financial Management
  static const String pocketMoneyEndpoint = '/pocket-money';
  static const String savingsEndpoint = '/savings';
  static const String billsEndpoint = '/bills';
  static const String paymentsEndpoint = '/payments';
  static const String infaqEndpoint = '/infaq';
  
  // Academic Management
  static const String attendanceEndpoint = '/attendance';
  static const String reportCardsEndpoint = '/report-cards';
  static const String achievementsEndpoint = '/achievements';
  
  // Library Management
  static const String libraryBooksEndpoint = '/library/books';
  static const String libraryLoansEndpoint = '/library/loans';
  
  // Communication
  static const String announcementsEndpoint = '/announcements';
  static const String notificationsEndpoint = '/notifications';
  static const String feedbackEndpoint = '/feedback';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';
  static const String biometricKey = 'biometric_enabled';
  static const String fcmTokenKey = 'fcm_token';
  
  // Cache Keys
  static const String userProfileCacheKey = 'user_profile';
  static const String santriDataCacheKey = 'santri_data';
  static const String pocketMoneyCacheKey = 'pocket_money';
  static const String billsCacheKey = 'bills';
  static const String announcementsCacheKey = 'announcements';
  
  // Cache Duration
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration mediumCacheDuration = Duration(minutes: 15);
  static const Duration longCacheDuration = Duration(hours: 1);
  static const Duration veryLongCacheDuration = Duration(hours: 24);
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // File Upload
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxDocumentSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  
  // Validation
  static const int minPasswordLength = 6;
  static const int maxPasswordLength = 128;
  static const int minPhoneLength = 10;
  static const int maxPhoneLength = 15;
  static const int minNameLength = 2;
  static const int maxNameLength = 100;
  
  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 200);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 300);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double defaultRadius = 8.0;
  static const double smallRadius = 4.0;
  static const double largeRadius = 16.0;
  
  // Error Messages
  static const String networkErrorMessage = 'No internet connection. Please check your connection and try again.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String timeoutErrorMessage = 'Request timeout. Please try again.';
  static const String unauthorizedErrorMessage = 'Session expired. Please login again.';
  static const String forbiddenErrorMessage = 'You don\'t have permission to perform this action.';
  static const String notFoundErrorMessage = 'Resource not found.';
  static const String validationErrorMessage = 'Please check your input and try again.';
  static const String unknownErrorMessage = 'An unexpected error occurred. Please try again.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Login successful!';
  static const String registerSuccessMessage = 'Registration successful! Please verify your phone number.';
  static const String otpSentMessage = 'OTP sent to your phone number.';
  static const String otpVerifiedMessage = 'OTP verified successfully!';
  static const String passwordResetMessage = 'Password reset successful!';
  static const String profileUpdatedMessage = 'Profile updated successfully!';
  static const String passwordChangedMessage = 'Password changed successfully!';
  static const String logoutSuccessMessage = 'Logged out successfully!';
  
  // User Roles
  static const String roleSantri = 'SANTRI';
  static const String roleWaliSantri = 'WALI_SANTRI';
  static const String roleAdmin = 'ADMIN';
  static const String roleFinance = 'FINANCE';
  static const String roleSuperAdmin = 'SUPER_ADMIN';
  
  // Transaction Types
  static const String transactionTopUp = 'TOP_UP';
  static const String transactionWithdrawal = 'WITHDRAWAL';
  static const String transactionTransfer = 'TRANSFER';
  static const String transactionPayment = 'PAYMENT';
  
  // Transaction Status
  static const String statusPending = 'PENDING';
  static const String statusSuccess = 'SUCCESS';
  static const String statusFailed = 'FAILED';
  static const String statusCancelled = 'CANCELLED';
  
  // Payment Methods
  static const String paymentBankTransfer = 'BANK_TRANSFER';
  static const String paymentEWallet = 'E_WALLET';
  static const String paymentCreditCard = 'CREDIT_CARD';
  static const String paymentCash = 'CASH';
  
  // Bill Types
  static const String billTuition = 'TUITION';
  static const String billDormitory = 'DORMITORY';
  static const String billMeal = 'MEAL';
  static const String billActivity = 'ACTIVITY';
  static const String billOther = 'OTHER';
  
  // Attendance Types
  static const String attendanceClass = 'CLASS';
  static const String attendancePrayer = 'PRAYER';
  static const String attendanceActivity = 'ACTIVITY';
  
  // Attendance Status
  static const String attendancePresent = 'PRESENT';
  static const String attendanceAbsent = 'ABSENT';
  static const String attendanceLate = 'LATE';
  static const String attendanceSick = 'SICK';
  static const String attendancePermission = 'PERMISSION';
  
  // Achievement Categories
  static const String achievementAcademic = 'ACADEMIC';
  static const String achievementReligious = 'RELIGIOUS';
  static const String achievementSports = 'SPORTS';
  static const String achievementArts = 'ARTS';
  static const String achievementLeadership = 'LEADERSHIP';
  static const String achievementOther = 'OTHER';
  
  // Achievement Levels
  static const String levelSchool = 'SCHOOL';
  static const String levelDistrict = 'DISTRICT';
  static const String levelProvince = 'PROVINCE';
  static const String levelNational = 'NATIONAL';
  static const String levelInternational = 'INTERNATIONAL';
  
  // Notification Types
  static const String notificationAnnouncement = 'ANNOUNCEMENT';
  static const String notificationPayment = 'PAYMENT';
  static const String notificationAttendance = 'ATTENDANCE';
  static const String notificationAcademic = 'ACADEMIC';
  static const String notificationSystem = 'SYSTEM';
  
  // Feedback Types
  static const String feedbackSuggestion = 'SUGGESTION';
  static const String feedbackComplaint = 'COMPLAINT';
  static const String feedbackQuestion = 'QUESTION';
  static const String feedbackAppreciation = 'APPRECIATION';
  
  // Feedback Status
  static const String feedbackOpen = 'OPEN';
  static const String feedbackInProgress = 'IN_PROGRESS';
  static const String feedbackResolved = 'RESOLVED';
  static const String feedbackClosed = 'CLOSED';
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String apiDateFormat = 'yyyy-MM-dd';
  static const String apiDateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  
  // Currency
  static const String currencySymbol = 'Rp';
  static const String currencyCode = 'IDR';
  
  // Localization
  static const String defaultLanguage = 'id';
  static const String defaultCountry = 'ID';
  
  // Biometric
  static const String biometricTitle = 'Biometric Authentication';
  static const String biometricSubtitle = 'Please authenticate to continue';
  static const String biometricCancel = 'Cancel';
  
  // Permissions
  static const String cameraPermission = 'Camera permission is required to take photos';
  static const String storagePermission = 'Storage permission is required to save files';
  static const String locationPermission = 'Location permission is required for attendance';
  static const String notificationPermission = 'Notification permission is required for updates';
  
  // Deep Links
  static const String deepLinkScheme = 'sinusa';
  static const String deepLinkHost = 'app';
  static const String deepLinkPaymentSuccess = '/payment/success';
  static const String deepLinkPaymentError = '/payment/error';
  static const String deepLinkPaymentPending = '/payment/pending';
  
  // Analytics Events
  static const String eventLogin = 'login';
  static const String eventRegister = 'register';
  static const String eventTopUp = 'pocket_money_top_up';
  static const String eventWithdrawal = 'pocket_money_withdrawal';
  static const String eventPayment = 'payment';
  static const String eventAttendance = 'attendance';
  static const String eventLibraryBorrow = 'library_borrow';
  static const String eventLibraryReturn = 'library_return';
  static const String eventFeedback = 'feedback';
  
  // Feature Flags
  static const bool enableBiometric = true;
  static const bool enableOfflineMode = true;
  static const bool enablePushNotifications = true;
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableDeepLinks = true;
  
  // Development
  static const bool isDevelopment = true;
  static const String developmentApiUrl = 'http://10.0.2.2:3000/api';
  static const String productionApiUrl = 'https://api.sinusa.com/api';
}