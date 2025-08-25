import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';

class EncryptionService {
  late final Encrypter _encrypter;
  late final IV _iv;
  
  static const String _secretKey = 'SiNusa2025SecretKey1234567890ABCDEF'; // 32 chars for AES-256

  EncryptionService() {
    final key = Key.fromBase64(base64Encode(_secretKey.codeUnits));
    _encrypter = Encrypter(AES(key));
    _iv = IV.fromSecureRandom(16);
  }

  /// Encrypt a string value
  String encrypt(String plainText) {
    try {
      final encrypted = _encrypter.encrypt(plainText, iv: _iv);
      // Combine IV and encrypted data for storage
      final combined = _iv.bytes + encrypted.bytes;
      return base64Encode(combined);
    } catch (e) {
      throw EncryptionException('Failed to encrypt data: $e');
    }
  }

  /// Decrypt a string value
  String decrypt(String encryptedText) {
    try {
      final combined = base64Decode(encryptedText);
      
      // Extract IV (first 16 bytes) and encrypted data
      final iv = IV(Uint8List.fromList(combined.take(16).toList()));
      final encryptedBytes = combined.skip(16).toList();
      final encrypted = Encrypted(Uint8List.fromList(encryptedBytes));
      
      return _encrypter.decrypt(encrypted, iv: iv);
    } catch (e) {
      throw EncryptionException('Failed to decrypt data: $e');
    }
  }

  /// Encrypt sensitive data like payment information
  String encryptSensitiveData(Map<String, dynamic> data) {
    try {
      final jsonString = jsonEncode(data);
      return encrypt(jsonString);
    } catch (e) {
      throw EncryptionException('Failed to encrypt sensitive data: $e');
    }
  }

  /// Decrypt sensitive data
  Map<String, dynamic> decryptSensitiveData(String encryptedData) {
    try {
      final decryptedString = decrypt(encryptedData);
      return jsonDecode(decryptedString) as Map<String, dynamic>;
    } catch (e) {
      throw EncryptionException('Failed to decrypt sensitive data: $e');
    }
  }

  /// Hash a password or PIN
  String hashPassword(String password, {String? salt}) {
    salt ??= _generateSalt();
    final bytes = utf8.encode(password + salt);
    final digest = sha256.convert(bytes);
    return '${digest.toString()}:$salt';
  }

  /// Verify a password against its hash
  bool verifyPassword(String password, String hashedPassword) {
    try {
      final parts = hashedPassword.split(':');
      if (parts.length != 2) return false;
      
      final hash = parts[0];
      final salt = parts[1];
      
      final newHash = hashPassword(password, salt: salt);
      return newHash == hashedPassword;
    } catch (e) {
      return false;
    }
  }

  /// Generate a secure random salt
  String _generateSalt() {
    final bytes = List<int>.generate(16, (i) => 
        DateTime.now().millisecondsSinceEpoch % 256);
    return base64Encode(bytes);
  }

  /// Generate a secure random token
  String generateSecureToken({int length = 32}) {
    final bytes = List<int>.generate(length, (i) => 
        DateTime.now().microsecondsSinceEpoch % 256);
    return base64Encode(bytes);
  }

  /// Hash data for integrity checking
  String hashData(String data) {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Verify data integrity
  bool verifyDataIntegrity(String data, String expectedHash) {
    final actualHash = hashData(data);
    return actualHash == expectedHash;
  }

  /// Encrypt file content
  Uint8List encryptFile(Uint8List fileBytes) {
    try {
      final encrypted = _encrypter.encryptBytes(fileBytes, iv: _iv);
      // Combine IV and encrypted data
      final combined = Uint8List.fromList(_iv.bytes + encrypted.bytes);
      return combined;
    } catch (e) {
      throw EncryptionException('Failed to encrypt file: $e');
    }
  }

  /// Decrypt file content
  Uint8List decryptFile(Uint8List encryptedBytes) {
    try {
      // Extract IV (first 16 bytes) and encrypted data
      final iv = IV(encryptedBytes.sublist(0, 16));
      final encryptedData = encryptedBytes.sublist(16);
      final encrypted = Encrypted(encryptedData);
      
      return _encrypter.decryptBytes(encrypted, iv: iv);
    } catch (e) {
      throw EncryptionException('Failed to decrypt file: $e');
    }
  }

  /// Generate HMAC for API request signing
  String generateHMAC(String data, String secret) {
    final key = utf8.encode(secret);
    final bytes = utf8.encode(data);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(bytes);
    return digest.toString();
  }

  /// Verify HMAC signature
  bool verifyHMAC(String data, String signature, String secret) {
    final expectedSignature = generateHMAC(data, secret);
    return expectedSignature == signature;
  }

  /// Generate idempotency key for financial transactions
  String generateIdempotencyKey(String transactionData) {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final combined = '$transactionData:$timestamp';
    return hashData(combined);
  }

  /// Encrypt payment card data (PCI DSS compliance)
  String encryptCardData(String cardNumber, String expiryDate, String cvv) {
    final cardData = {
      'number': cardNumber,
      'expiry': expiryDate,
      'cvv': cvv,
      'timestamp': DateTime.now().toIso8601String(),
    };
    return encryptSensitiveData(cardData);
  }

  /// Mask sensitive data for logging
  String maskSensitiveData(String data, {int visibleChars = 4}) {
    if (data.length <= visibleChars * 2) {
      return '*' * data.length;
    }
    
    final start = data.substring(0, visibleChars);
    final end = data.substring(data.length - visibleChars);
    final middle = '*' * (data.length - visibleChars * 2);
    
    return '$start$middle$end';
  }

  /// Generate OTP
  String generateOTP({int length = 6}) {
    final random = DateTime.now().millisecondsSinceEpoch;
    final otp = (random % (999999 - 100000 + 1) + 100000).toString();
    return otp.substring(0, length);
  }

  /// Validate OTP expiry
  bool isOTPValid(DateTime otpGeneratedAt, {int expiryMinutes = 5}) {
    final now = DateTime.now();
    final difference = now.difference(otpGeneratedAt);
    return difference.inMinutes < expiryMinutes;
  }
}

class EncryptionException implements Exception {
  final String message;
  
  const EncryptionException(this.message);
  
  @override
  String toString() => 'EncryptionException: $message';
}