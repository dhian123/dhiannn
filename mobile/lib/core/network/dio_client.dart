import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';
import '../utils/app_logger.dart';
import '../storage/local_storage.dart';

class DioClient {
  late final Dio _dio;
  final LocalStorage? _localStorage;

  DioClient(Dio dio, {LocalStorage? localStorage}) : _localStorage = localStorage {
    _dio = dio;
    _configureDio();
  }

  Dio get dio => _dio;

  void _configureDio() {
    _dio.options = BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    // Add interceptors
    _dio.interceptors.addAll([
      _AuthInterceptor(_localStorage),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);
  }

  // GET Request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // POST Request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // PUT Request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // DELETE Request
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // PATCH Request
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Upload File
  Future<Response> uploadFile(
    String path,
    String filePath, {
    String? fileName,
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
        if (data != null) ...data,
      });

      final response = await _dio.post(
        path,
        data: formData,
        onSendProgress: onSendProgress,
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }
}

// Auth Interceptor - Adds JWT token to requests
class _AuthInterceptor extends Interceptor {
  final LocalStorage? _localStorage;

  _AuthInterceptor(this._localStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (_localStorage != null) {
      final token = await _localStorage!.getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, try to refresh
      if (_localStorage != null) {
        final refreshToken = await _localStorage!.getRefreshToken();
        if (refreshToken != null) {
          try {
            // Attempt to refresh token
            final dio = Dio();
            final response = await dio.post(
              '${AppConstants.baseUrl}/auth/refresh',
              data: {'refresh_token': refreshToken},
            );

            if (response.statusCode == 200) {
              final newToken = response.data['access_token'];
              final newRefreshToken = response.data['refresh_token'];
              
              await _localStorage!.saveToken(newToken);
              await _localStorage!.saveRefreshToken(newRefreshToken);

              // Retry original request with new token
              err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              final retryResponse = await dio.fetch(err.requestOptions);
              handler.resolve(retryResponse);
              return;
            }
          } catch (e) {
            // Refresh failed, clear tokens
            await _localStorage!.clearTokens();
          }
        }
      }
    }
    handler.next(err);
  }
}

// Logging Interceptor - Logs requests and responses in debug mode
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      AppLogger.d('REQUEST[${options.method}] => PATH: ${options.path}');
      AppLogger.d('Headers: ${options.headers}');
      if (options.data != null) {
        AppLogger.d('Data: ${options.data}');
      }
      if (options.queryParameters.isNotEmpty) {
        AppLogger.d('Query Parameters: ${options.queryParameters}');
      }
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      AppLogger.d('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
      AppLogger.d('Data: ${response.data}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      AppLogger.e('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
      AppLogger.e('Message: ${err.message}');
      if (err.response != null) {
        AppLogger.e('Response: ${err.response?.data}');
      }
    }
    handler.next(err);
  }
}

// Error Interceptor - Handles common HTTP errors
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String errorMessage;

    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        errorMessage = AppConstants.networkError;
        break;
      case DioExceptionType.badResponse:
        errorMessage = _handleHttpError(err.response?.statusCode);
        break;
      case DioExceptionType.cancel:
        errorMessage = 'Request was cancelled';
        break;
      case DioExceptionType.unknown:
        errorMessage = AppConstants.networkError;
        break;
      default:
        errorMessage = AppConstants.unknownError;
        break;
    }

    final customError = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: errorMessage,
    );

    handler.next(customError);
  }

  String _handleHttpError(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Bad request';
      case 401:
        return AppConstants.sessionExpired;
      case 403:
        return AppConstants.accessDenied;
      case 404:
        return 'Data not found';
      case 408:
        return 'Request timeout';
      case 422:
        return 'Validation error';
      case 500:
        return AppConstants.serverError;
      case 502:
        return 'Bad gateway';
      case 503:
        return 'Service unavailable';
      case 504:
        return 'Gateway timeout';
      default:
        return AppConstants.serverError;
    }
  }
}