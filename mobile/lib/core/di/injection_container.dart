import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive/hive.dart';

import '../network/dio_client.dart';
import '../storage/local_storage.dart';
import '../security/encryption_service.dart';
import '../utils/app_logger.dart';
import '../../data/datasources/auth_local_datasource.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/check_auth_status_usecase.dart';
import '../../presentation/bloc/auth/auth_bloc.dart';
import '../../presentation/bloc/connectivity/connectivity_bloc.dart';

import 'injection_container.config.dart';

final GetIt getIt = GetIt.instance;

@InjectableInit()
Future<void> configureDependencies() async {
  await _registerExternalDependencies();
  getIt.init();
}

Future<void> _registerExternalDependencies() async {
  // Shared Preferences
  final sharedPreferences = await SharedPreferences.getInstance();
  getIt.registerLazySingleton<SharedPreferences>(() => sharedPreferences);

  // Connectivity
  getIt.registerLazySingleton<Connectivity>(() => Connectivity());

  // Hive Boxes
  final authBox = await Hive.openBox('auth');
  final cacheBox = await Hive.openBox('cache');
  final offlineBox = await Hive.openBox('offline');
  
  getIt.registerLazySingleton<Box>(() => authBox, instanceName: 'authBox');
  getIt.registerLazySingleton<Box>(() => cacheBox, instanceName: 'cacheBox');
  getIt.registerLazySingleton<Box>(() => offlineBox, instanceName: 'offlineBox');

  // Dio Client
  final dio = Dio();
  getIt.registerLazySingleton<Dio>(() => dio);
  
  // Core Services
  getIt.registerLazySingleton<DioClient>(() => DioClient(dio));
  getIt.registerLazySingleton<LocalStorage>(() => LocalStorage(sharedPreferences));
  getIt.registerLazySingleton<EncryptionService>(() => EncryptionService());
  getIt.registerLazySingleton<AppLogger>(() => AppLogger());

  // Data Sources
  getIt.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(
      localStorage: getIt<LocalStorage>(),
      authBox: getIt<Box>(instanceName: 'authBox'),
    ),
  );

  getIt.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(
      dioClient: getIt<DioClient>(),
    ),
  );

  // Repositories
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      localDataSource: getIt<AuthLocalDataSource>(),
      remoteDataSource: getIt<AuthRemoteDataSource>(),
      connectivity: getIt<Connectivity>(),
    ),
  );

  // Use Cases
  getIt.registerLazySingleton<LoginUseCase>(
    () => LoginUseCase(getIt<AuthRepository>()),
  );

  getIt.registerLazySingleton<LogoutUseCase>(
    () => LogoutUseCase(getIt<AuthRepository>()),
  );

  getIt.registerLazySingleton<CheckAuthStatusUseCase>(
    () => CheckAuthStatusUseCase(getIt<AuthRepository>()),
  );

  // Blocs
  getIt.registerFactory<AuthBloc>(
    () => AuthBloc(
      loginUseCase: getIt<LoginUseCase>(),
      logoutUseCase: getIt<LogoutUseCase>(),
      checkAuthStatusUseCase: getIt<CheckAuthStatusUseCase>(),
    ),
  );

  getIt.registerFactory<ConnectivityBloc>(
    () => ConnectivityBloc(connectivity: getIt<Connectivity>()),
  );
}