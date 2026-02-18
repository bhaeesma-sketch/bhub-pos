import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:dukkantek_pos_flutter/screens/dashboard_screen.dart';
import 'package:dukkantek_pos_flutter/services/auth_service.dart';

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
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Authentication Failed: ${e.toString()}'),
        backgroundColor: Colors.redAccent,
      ));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEmailMode = ref.watch(loginModeProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 100
      body: Center(
        child: Container(
          width: 900,
          height: 600,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 50, offset: const Offset(0, 10))],
          ),
          child: Row(
            children: [
              // LEFT: Branding
              Expanded(
                flex: 1,
                child: Container(
                  padding: const EdgeInsets.all(40),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F172A), // Slate 900
                    borderRadius: BorderRadius.horizontal(left: Radius.circular(30)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          border: Border.all(color: const Color(0xFFD4AF37), width: 2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(FontAwesomeIcons.cashRegister, size: 60, color: Color(0xFFD4AF37)),
                      ),
                      const SizedBox(height: 30),
                      const Text(
                        'B-HUB RETAIL',
                        style: TextStyle(color: Color(0xFFD4AF37), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 5),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Enterprise Edition v4.0',
                        style: TextStyle(color: Colors.slate.shade400, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2),
                      ),
                      const Spacer(),
                      Text(
                        '© 2026 BHAEES SYSTEMS\nOMAN MARKET COMPLIANT',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.slate.shade600, fontSize: 10, fontWeight: FontWeight.bold, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ),
              
              // RIGHT: Form
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.all(60),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEmailMode ? 'Owner Portal' : 'Staff Access',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        isEmailMode ? 'Please sign in to manage operations' : 'Enter your security pin to unlock POS',
                        style: TextStyle(color: Colors.slate.shade400, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 40),

                      if (isEmailMode) ...[
                        _buildField('Email Address', Icons.email_outlined, _emailController, false),
                        const SizedBox(height: 20),
                        _buildField('Password', Icons.lock_outline, _passwordController, true),
                      ] else ...[
                        _buildField('Security PIN', Icons.key_outlined, _pinController, true, isPin: true),
                      ],

                      const SizedBox(height: 40),
                      
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading 
                            ? const CircularProgressIndicator(color: Colors.white) 
                            : Text(isEmailMode ? 'CONTINUE TO DASHBOARD' : 'UNLOCK REGISTER', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.5)),
                        ),
                      ),
                      
                      const SizedBox(height: 25),
                      Center(
                        child: TextButton(
                          onPressed: () => ref.read(loginModeProvider.notifier).state = !isEmailMode,
                          child: Text(
                            isEmailMode ? 'USE STAFF PIN LOGIN' : 'BACK TO OWNER PORTAL',
                            style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, IconData icon, TextEditingController controller, bool obscure, {bool isPin = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: isPin ? TextInputType.number : TextInputType.emailAddress,
          maxLength: isPin ? 4 : null,
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: isPin ? 24 : 14, color: const Color(0xFF0F172A), letterSpacing: isPin ? 20 : 0),
          decoration: InputDecoration(
            counterText: '',
            prefixIcon: Icon(icon, color: Colors.slate.shade300, size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD4AF37))),
          ),
        ),
      ],
    );
  }
}
