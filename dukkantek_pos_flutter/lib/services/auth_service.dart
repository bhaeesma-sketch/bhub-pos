import 'package:flutter_riverpod/flutter_riverpod.dart';

// Mock User Model
class User {
  final String uid;
  final String email;
  final String role; // 'admin', 'cashier', 'manager'

  User({required this.uid, required this.email, required this.role});
}

// Auth State Provider
final authStateProvider = StateProvider<User?>((ref) => null);

// Auth Business Logic
class AuthService {
  final Ref ref;

  AuthService(this.ref);

  Future<void> signInWithEmailPassword(String email, String password) async {
    // In real implementation: await FirebaseAuth.instance.signInWithEmailAndPassword(...)
    // Mock success for demo:
    await Future.delayed(const Duration(seconds: 1));
    if (email == 'admin@pos.com' && password == '1234') {
      ref.read(authStateProvider.notifier).state = User(uid: '123', email: email, role: 'admin');
    } else {
      throw Exception('Invalid credentials');
    }
  }

  Future<void> signInWithPin(String pin) async {
    // Fast login for cashiers
    await Future.delayed(const Duration(milliseconds: 500));
    if (pin == '0000') {
       ref.read(authStateProvider.notifier).state = User(uid: '456', email: 'cashier@pos.com', role: 'cashier');
    } else {
      throw Exception('Invalid PIN');
    }
  }

  Future<void> signOut() async {
    ref.read(authStateProvider.notifier).state = null;
  }
}

final authServiceProvider = Provider((ref) => AuthService(ref));
