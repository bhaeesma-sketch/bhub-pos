import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';

// Import screens (will be created next)
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/pos_screen.dart';
import 'firebase_options.dart'; // Placeholder

import 'package:hive_flutter/hive_flutter.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:dukkantek_pos_flutter/services/offline_service.dart';
import 'package:dukkantek_pos_flutter/services/hive_adapters.dart'; // Manual Adapters

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Hive Init
  await Hive.initFlutter();
  
  // Register Manual Adapters
  // This bypasses the need for build_runner generated code
  try {
     Hive.registerAdapter(ProductAdapter());
     Hive.registerAdapter(SaleItemAdapter());
     Hive.registerAdapter(SaleAdapter());
     
     // Setup offline service boxes
     final offlineService = OfflineService();
     await offlineService.init();
  } catch (e) {
     print("Hive Init Error: $e");
  }

  // Initialize Firebase (Requires actual config in firebase_options.dart)
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  runApp(const ProviderScope(child: MyApp()));
}

// -----------------------------------------------------------------------------
// Providers
// -----------------------------------------------------------------------------

final themeProvider = StateProvider<bool>((ref) => false); // false = Light, true = Dark

// -----------------------------------------------------------------------------
// App Root
// -----------------------------------------------------------------------------

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'BHAEES Enterprise POS',
      
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A), 
          brightness: Brightness.light,
        ),
        textTheme: GoogleFonts.outfitTextTheme(),
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
      ),
      
      home: const AuthGate(),
    );
  }
}

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const LoginScreen();
  }
}
