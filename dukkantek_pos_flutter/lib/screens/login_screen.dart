import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:lottie/lottie.dart';

import 'package:dukkantek_pos_flutter/screens/dashboard_screen.dart'; // Will create this next
import 'package:dukkantek_pos_flutter/services/auth_service.dart';

// State for Login: Email vs PIN mode
final loginModeProvider = StateProvider<bool>((ref) => true); // true = Email, false = PIN

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'admin@pos.com');
  final _passwordController = TextEditingController(text: '1234');
  final _pinController = TextEditingController();
  
  bool _isLoading = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);
    final isEmailMode = ref.read(loginModeProvider);
    final auth = ref.read(authServiceProvider);
    
    try {
      if (isEmailMode) {
        await auth.signInWithEmailPassword(_emailController.text, _passwordController.text);
      } else {
        await auth.signInWithPin(_pinController.text);
      }
      
      if (!mounted) return;
      // Navigate to Dashboard on Success
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login Failed: ${e.toString()}')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEmailMode = ref.watch(loginModeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Row(
        children: [
          // Left Side - Branding (Hidden on Mobile if needed, but keeping for Tablet/Web Layout)
          Expanded(
            flex: 3,
            child: Container(
              color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFF6750A4), 
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Lottie.asset('assets/lottie/pos_animation.json', width: 200), // Placeholder
                    const Icon(FontAwesomeIcons.cashRegister, size: 80, color: Colors.white),
                    const SizedBox(height: 20),
                    const Text(
                      'Dukkantek POS',
                      style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Oman\'s #1 Retail Solution',
                      style: TextStyle(fontSize: 18, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Right Side - Login Form
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    isEmailMode ? 'Welcome Back!' : 'Enter Employee PIN',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),

                  if (isEmailMode) ...[
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email)),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock)),
                    ),
                  ] else ...[
                    // PIN Pad Logic (Simplified for now)
                    TextFormField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      maxLength: 4,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 32, letterSpacing: 10),
                      decoration: const InputDecoration(hintText: '----'),
                    ),
                  ],

                  const SizedBox(height: 30),
                  
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6750A4),
                        foregroundColor: Colors.white,
                      ),
                      child: _isLoading 
                        ? const CircularProgressIndicator(color: Colors.white) 
                        : Text(isEmailMode ? 'Login' : 'Unlock Register'),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: () => ref.read(loginModeProvider.notifier).state = !isEmailMode,
                    child: Text(isEmailMode ? 'Switch to PIN Login' : 'Switch to Email Login'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
