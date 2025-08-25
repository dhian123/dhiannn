class AppConstants {
  // App Info
  static const String appName = 'SiNusa';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Santri & Wali Santri Information System';
  
  // API Configuration
  static const String baseUrl = 'https://api.sinusa.com/v1';
  static const String socketUrl = 'wss://api.sinusa.com';
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  
  // Authentication
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String biometricKey = 'biometric_enabled';
  static const int otpLength = 6;
  static const int otpExpiryMinutes = 5;
  
  // Local Storage Keys
  static const String offlineDataBox = 'offline_data';
  static const String settingsBox = 'settings';
  static const String cacheBox = 'cache';
  
  // User Roles
  static const String roleSantri = 'SANTRI';
  static const String roleWaliSantri = 'WALI_SANTRI';
  static const String roleAdmin = 'ADMIN';
  static const String roleStaff = 'STAFF';
  static const String roleFinance = 'FINANCE';
  static const String roleSuperAdmin = 'SUPER_ADMIN';
  
  // Transaction Types
  static const String transactionTopUp = 'TOP_UP';
  static const String transactionPayment = 'PAYMENT';
  static const String transactionWithdrawal = 'WITHDRAWAL';
  static const String transactionDeposit = 'DEPOSIT';
  static const String transactionInfaq = 'INFAQ';
  
  // Payment Status
  static const String paymentPending = 'PENDING';
  static const String paymentCompleted = 'COMPLETED';
  static const String paymentFailed = 'FAILED';
  static const String paymentCancelled = 'CANCELLED';
  
  // Notification Types
  static const String notificationPayment = 'PAYMENT';
  static const String notificationAnnouncement = 'ANNOUNCEMENT';
  static const String notificationAttendance = 'ATTENDANCE';
  static const String notificationGrade = 'GRADE';
  static const String notificationLibrary = 'LIBRARY';
  
  // File Types
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  static const int maxFileSize = 5 * 1024 * 1024; // 5MB
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Cache Duration
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration mediumCacheDuration = Duration(hours: 1);
  static const Duration longCacheDuration = Duration(hours: 24);
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 50;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 20;
  
  // Currency
  static const String currency = 'IDR';
  static const String currencySymbol = 'Rp';
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';
  static const String monthYearFormat = 'MMMM yyyy';
  
  // Error Messages
  static const String networkError = 'Koneksi internet bermasalah';
  static const String serverError = 'Terjadi kesalahan server';
  static const String unknownError = 'Terjadi kesalahan tidak dikenal';
  static const String sessionExpired = 'Sesi telah berakhir, silakan login kembali';
  static const String accessDenied = 'Akses ditolak';
  
  // Success Messages
  static const String loginSuccess = 'Login berhasil';
  static const String logoutSuccess = 'Logout berhasil';
  static const String paymentSuccess = 'Pembayaran berhasil';
  static const String topUpSuccess = 'Top up berhasil';
  static const String dataUpdated = 'Data berhasil diperbarui';
  
  // Offline Messages
  static const String offlineMode = 'Mode offline aktif';
  static const String syncingData = 'Menyinkronkan data...';
  static const String syncComplete = 'Sinkronisasi selesai';
  static const String syncFailed = 'Sinkronisasi gagal';
}