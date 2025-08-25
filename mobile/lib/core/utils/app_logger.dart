import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

class AppLogger {
  static late Logger _logger;
  static bool _initialized = false;

  static void init() {
    if (_initialized) return;
    
    _logger = Logger(
      printer: PrettyPrinter(
        methodCount: 2,
        errorMethodCount: 8,
        lineLength: 120,
        colors: true,
        printEmojis: true,
        printTime: true,
      ),
      output: _LogOutput(),
    );
    
    _initialized = true;
  }

  static void d(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.d(message, error: error, stackTrace: stackTrace);
  }

  static void i(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.i(message, error: error, stackTrace: stackTrace);
  }

  static void w(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.w(message, error: error, stackTrace: stackTrace);
  }

  static void e(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.e(message, error: error, stackTrace: stackTrace);
  }

  static void v(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.t(message, error: error, stackTrace: stackTrace);
  }

  static void wtf(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    if (!_initialized) init();
    _logger.f(message, error: error, stackTrace: stackTrace);
  }

  // Network logging
  static void logRequest(String method, String url, Map<String, dynamic>? data) {
    if (!kDebugMode) return;
    
    d('🌐 REQUEST [$method] $url');
    if (data != null && data.isNotEmpty) {
      d('📤 Data: $data');
    }
  }

  static void logResponse(int statusCode, String url, dynamic data) {
    if (!kDebugMode) return;
    
    if (statusCode >= 200 && statusCode < 300) {
      d('✅ RESPONSE [$statusCode] $url');
    } else {
      w('⚠️ RESPONSE [$statusCode] $url');
    }
    
    if (data != null) {
      d('📥 Data: $data');
    }
  }

  static void logError(String operation, dynamic error, [StackTrace? stackTrace]) {
    e('❌ Error in $operation: $error', error, stackTrace);
  }

  // Authentication logging
  static void logAuth(String action, {String? userId}) {
    i('🔐 Auth: $action${userId != null ? ' (User: $userId)' : ''}');
  }

  // Payment logging (with sensitive data masking)
  static void logPayment(String action, String transactionId, double amount) {
    i('💳 Payment: $action - Transaction: $transactionId - Amount: Rp ${amount.toStringAsFixed(0)}');
  }

  // User action logging
  static void logUserAction(String action, {Map<String, dynamic>? metadata}) {
    i('👤 User Action: $action${metadata != null ? ' - $metadata' : ''}');
  }

  // Performance logging
  static void logPerformance(String operation, Duration duration) {
    if (duration.inMilliseconds > 1000) {
      w('⏱️ Slow Operation: $operation took ${duration.inMilliseconds}ms');
    } else {
      d('⏱️ Performance: $operation took ${duration.inMilliseconds}ms');
    }
  }

  // Cache logging
  static void logCache(String action, String key, {bool hit = false}) {
    d('🗄️ Cache: $action - Key: $key${hit ? ' (HIT)' : ' (MISS)'}');
  }

  // Offline/Sync logging
  static void logSync(String action, {int? count}) {
    i('🔄 Sync: $action${count != null ? ' ($count items)' : ''}');
  }

  static void logOffline(String message) {
    w('📱 Offline: $message');
  }

  // Security logging
  static void logSecurity(String event, {String? details}) {
    w('🔒 Security: $event${details != null ? ' - $details' : ''}');
  }

  // Business logic logging
  static void logBusiness(String event, Map<String, dynamic> data) {
    i('📊 Business: $event - $data');
  }

  // Database logging
  static void logDatabase(String operation, String table, {int? affectedRows}) {
    d('🗃️ Database: $operation on $table${affectedRows != null ? ' ($affectedRows rows)' : ''}');
  }

  // Navigation logging
  static void logNavigation(String from, String to) {
    d('🧭 Navigation: $from → $to');
  }

  // Feature flag logging
  static void logFeatureFlag(String flag, bool enabled) {
    d('🎚️ Feature Flag: $flag = $enabled');
  }

  // Custom structured logging
  static void logStructured({
    required String event,
    required Map<String, dynamic> data,
    LogLevel level = LogLevel.info,
  }) {
    final message = '📋 Event: $event - Data: $data';
    
    switch (level) {
      case LogLevel.debug:
        d(message);
        break;
      case LogLevel.info:
        i(message);
        break;
      case LogLevel.warning:
        w(message);
        break;
      case LogLevel.error:
        e(message);
        break;
      case LogLevel.verbose:
        v(message);
        break;
      case LogLevel.wtf:
        wtf(message);
        break;
    }
  }
}

enum LogLevel {
  debug,
  info,
  warning,
  error,
  verbose,
  wtf,
}

class _LogOutput extends LogOutput {
  @override
  void output(OutputEvent event) {
    for (var line in event.lines) {
      if (kDebugMode) {
        developer.log(line, name: 'SiNusa');
      }
    }
  }
}