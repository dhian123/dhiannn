import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../security/encryption_service.dart';

class LocalStorage {
  final SharedPreferences _prefs;
  final EncryptionService _encryptionService = EncryptionService();

  LocalStorage(this._prefs);

  // Token Management
  Future<void> saveToken(String token) async {
    final encryptedToken = _encryptionService.encrypt(token);
    await _prefs.setString(AppConstants.tokenKey, encryptedToken);
  }

  Future<String?> getToken() async {
    final encryptedToken = _prefs.getString(AppConstants.tokenKey);
    if (encryptedToken != null) {
      return _encryptionService.decrypt(encryptedToken);
    }
    return null;
  }

  Future<void> saveRefreshToken(String refreshToken) async {
    final encryptedToken = _encryptionService.encrypt(refreshToken);
    await _prefs.setString(AppConstants.refreshTokenKey, encryptedToken);
  }

  Future<String?> getRefreshToken() async {
    final encryptedToken = _prefs.getString(AppConstants.refreshTokenKey);
    if (encryptedToken != null) {
      return _encryptionService.decrypt(encryptedToken);
    }
    return null;
  }

  Future<void> clearTokens() async {
    await _prefs.remove(AppConstants.tokenKey);
    await _prefs.remove(AppConstants.refreshTokenKey);
  }

  // User Data Management
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    final encryptedData = _encryptionService.encrypt(jsonEncode(userData));
    await _prefs.setString(AppConstants.userDataKey, encryptedData);
  }

  Future<Map<String, dynamic>?> getUserData() async {
    final encryptedData = _prefs.getString(AppConstants.userDataKey);
    if (encryptedData != null) {
      final decryptedData = _encryptionService.decrypt(encryptedData);
      return jsonDecode(decryptedData) as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> clearUserData() async {
    await _prefs.remove(AppConstants.userDataKey);
  }

  // Settings Management
  Future<void> setBiometricEnabled(bool enabled) async {
    await _prefs.setBool(AppConstants.biometricKey, enabled);
  }

  bool getBiometricEnabled() {
    return _prefs.getBool(AppConstants.biometricKey) ?? false;
  }

  Future<void> setThemeMode(String themeMode) async {
    await _prefs.setString('theme_mode', themeMode);
  }

  String getThemeMode() {
    return _prefs.getString('theme_mode') ?? 'system';
  }

  Future<void> setLanguage(String languageCode) async {
    await _prefs.setString('language', languageCode);
  }

  String getLanguage() {
    return _prefs.getString('language') ?? 'id';
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    await _prefs.setBool('notifications_enabled', enabled);
  }

  bool getNotificationsEnabled() {
    return _prefs.getBool('notifications_enabled') ?? true;
  }

  // Cache Management
  Future<void> setCacheData(String key, Map<String, dynamic> data) async {
    final cacheData = {
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    await _prefs.setString('cache_$key', jsonEncode(cacheData));
  }

  Future<Map<String, dynamic>?> getCacheData(String key, {Duration? maxAge}) async {
    final cacheString = _prefs.getString('cache_$key');
    if (cacheString != null) {
      final cacheData = jsonDecode(cacheString) as Map<String, dynamic>;
      final timestamp = cacheData['timestamp'] as int;
      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      
      if (maxAge != null) {
        final now = DateTime.now();
        if (now.difference(cacheTime) > maxAge) {
          // Cache expired
          await clearCacheData(key);
          return null;
        }
      }
      
      return cacheData['data'] as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> clearCacheData(String key) async {
    await _prefs.remove('cache_$key');
  }

  Future<void> clearAllCache() async {
    final keys = _prefs.getKeys();
    final cacheKeys = keys.where((key) => key.startsWith('cache_'));
    for (final key in cacheKeys) {
      await _prefs.remove(key);
    }
  }

  // First Launch Management
  Future<void> setFirstLaunch(bool isFirstLaunch) async {
    await _prefs.setBool('is_first_launch', isFirstLaunch);
  }

  bool isFirstLaunch() {
    return _prefs.getBool('is_first_launch') ?? true;
  }

  // Onboarding Management
  Future<void> setOnboardingCompleted(bool completed) async {
    await _prefs.setBool('onboarding_completed', completed);
  }

  bool isOnboardingCompleted() {
    return _prefs.getBool('onboarding_completed') ?? false;
  }

  // Last Sync Management
  Future<void> setLastSyncTime(DateTime dateTime) async {
    await _prefs.setInt('last_sync_time', dateTime.millisecondsSinceEpoch);
  }

  DateTime? getLastSyncTime() {
    final timestamp = _prefs.getInt('last_sync_time');
    if (timestamp != null) {
      return DateTime.fromMillisecondsSinceEpoch(timestamp);
    }
    return null;
  }

  // PIN Management
  Future<void> savePIN(String pin) async {
    final encryptedPIN = _encryptionService.encrypt(pin);
    await _prefs.setString('user_pin', encryptedPIN);
  }

  Future<String?> getPIN() async {
    final encryptedPIN = _prefs.getString('user_pin');
    if (encryptedPIN != null) {
      return _encryptionService.decrypt(encryptedPIN);
    }
    return null;
  }

  Future<void> clearPIN() async {
    await _prefs.remove('user_pin');
  }

  // Device ID Management
  Future<void> saveDeviceId(String deviceId) async {
    await _prefs.setString('device_id', deviceId);
  }

  String? getDeviceId() {
    return _prefs.getString('device_id');
  }

  // Clear All Data
  Future<void> clearAllData() async {
    await _prefs.clear();
  }

  // Generic Methods
  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<void> setInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    return _prefs.getInt(key);
  }

  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> setDouble(String key, double value) async {
    await _prefs.setDouble(key, value);
  }

  double? getDouble(String key) {
    return _prefs.getDouble(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  bool containsKey(String key) {
    return _prefs.containsKey(key);
  }

  Set<String> getKeys() {
    return _prefs.getKeys();
  }
}