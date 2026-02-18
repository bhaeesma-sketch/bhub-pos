import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/customer.dart';
import 'package:dukkantek_pos_flutter/services/customer_service.dart';

class CustomersScreen extends ConsumerWidget {
  const CustomersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customersStream = ref.watch(customerServiceProvider).getCustomers();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 100
      appBar: AppBar(
        title: const Text('Khat Ledger (Credit Registry)', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 20),
            child: ElevatedButton.icon(
              onPressed: () => _showAddCustomerDialog(context, ref),
              icon: const Icon(Icons.person_add_alt_1, size: 18),
              label: const Text('NEW CLIENT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
      body: StreamBuilder<List<Customer>>(
        stream: customersStream,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final customers = snapshot.data!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSummaryCards(customers),
                const SizedBox(height: 40),
                const Text('CUSTOMER ACCOUNTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
                const SizedBox(height: 15),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: customers.length,
                  itemBuilder: (context, index) {
                    final customer = customers[index];
                    return _buildCustomerItem(context, customer);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryCards(List<Customer> customers) {
    final totalDebt = customers.fold(0.0, (sum, c) => sum + c.totalDebt);
    return Row(
      children: [
        _buildStatCard('Total Outstanding', 'OMR ${totalDebt.toStringAsFixed(3)}', Colors.red, Icons.account_balance_wallet_outlined),
        const SizedBox(width: 25),
        _buildStatCard('Active Accounts', '${customers.length}', Colors.blue, Icons.people_outline),
        const SizedBox(width: 25),
        _buildStatCard('Collection Rate', '84%', Colors.green, Icons.trending_up_outlined),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(25),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.slate.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20)],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 5),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF0F172A))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerItem(BuildContext context, Customer customer) {
    bool hasDebt = customer.totalDebt > 0;
    return Container(
      margin: const EdgeInsets.bottom(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.slate.shade100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFF1F5F9),
          child: Text(customer.name[0].toUpperCase(), style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900)),
        ),
        title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
        subtitle: Text('WhatsApp: ${customer.phone}', style: TextStyle(color: Colors.slate.shade400, fontSize: 11, fontWeight: FontWeight.bold)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('OMR ${customer.totalDebt.toStringAsFixed(3)}', 
              style: TextStyle(color: hasDebt ? Colors.red : Colors.green, fontWeight: FontWeight.w900, fontSize: 15)),
            Text(hasDebt ? 'Outstanding' : 'Cleared', style: TextStyle(fontSize: 10, color: Colors.slate.shade300, fontWeight: FontWeight.bold)),
          ],
        ),
        onTap: () => _showCustomerDetails(context, customer),
      ),
    );
  }

  void _showAddCustomerDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add New Customer Account', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('NAME'.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1)),
            TextField(controller: nameController, decoration: const InputDecoration(hintText: 'Full Name', contentPadding: EdgeInsets.symmetric(vertical: 10))),
            const SizedBox(height: 20),
            Text('PHONE'.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1)),
            TextField(controller: phoneController, decoration: const InputDecoration(hintText: '+968 XXXX XXXX', contentPadding: EdgeInsets.symmetric(vertical: 10))),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.slate))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A)),
            onPressed: () {
              if (nameController.text.isEmpty) return;
              final newCustomer = Customer(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                name: nameController.text,
                phone: phoneController.text,
              );
              ref.read(customerServiceProvider).addCustomer(newCustomer);
              Navigator.pop(context);
            },
            child: const Text('SAVE ACCOUNT', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
          ),
        ],
      ),
    );
  }
  
  void _showCustomerDetails(BuildContext context, Customer customer) {
     showModalBottomSheet(
       context: context,
       shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
       builder: (context) => Padding(
         padding: const EdgeInsets.all(30),
         child: Column(
           mainAxisSize: MainAxisSize.min,
           children: [
             Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.slate.shade100, borderRadius: BorderRadius.circular(2))),
             const SizedBox(height: 20),
             Text(customer.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
             const SizedBox(height: 5),
             Text('Registration ID: ${customer.id}', style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 11)),
             const SizedBox(height: 30),
             Row(
               mainAxisAlignment: MainAxisAlignment.spaceAround,
               children: [
                 _buildDetailTab('TOTAL DEBT', 'OMR ${customer.totalDebt.toStringAsFixed(3)}', Colors.red),
                 _buildDetailTab('LAST ACTIVE', 'Today', Colors.blue),
               ],
             ),
             const SizedBox(height: 40),
             SizedBox(
               width: double.infinity,
               height: 55,
               child: ElevatedButton.icon(
                 onPressed: () {},
                 icon: const Icon(Icons.whatsapp, color: Colors.white),
                 label: const Text('SEND PAYMENT REMINDER', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
                 style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
               ),
             ),
             const SizedBox(height: 15),
             SizedBox(
               width: double.infinity,
               height: 55,
               child: OutlinedButton(
                 onPressed: () => Navigator.pop(context),
                 style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)), side: BorderSide(color: Colors.slate.shade200)),
                 child: const Text('CLOSE REGISTRY', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1)),
               ),
             ),
           ],
         ),
       ),
     );
  }

  Widget _buildDetailTab(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1.5)),
        const SizedBox(height: 5),
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
      ],
    );
  }
}
