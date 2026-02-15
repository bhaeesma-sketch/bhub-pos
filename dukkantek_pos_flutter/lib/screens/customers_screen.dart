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
      appBar: AppBar(
        title: const Text('Khat Leder (Customer Credit)'),
        actions: [
          ElevatedButton.icon(
            onPressed: () => _showAddCustomerDialog(context, ref),
            icon: const Icon(Icons.person_add),
            label: const Text('Add Customer'),
          ),
          const SizedBox(width: 20),
        ],
      ),
      body: StreamBuilder<List<Customer>>(
        stream: customersStream,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final customers = snapshot.data!;

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSummaryCards(customers),
                const SizedBox(height: 30),
                Expanded(
                  child: Card(
                    child: ListView.separated(
                      itemCount: customers.length,
                      separatorBuilder: (context, index) => const Divider(),
                      itemBuilder: (context, index) {
                        final customer = customers[index];
                        return ListTile(
                          leading: CircleAvatar(child: Text(customer.name[0])),
                          title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(customer.phone),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('OMR ${customer.totalDebt.toStringAsFixed(3)}', 
                                style: TextStyle(color: customer.totalDebt > 0 ? Colors.red : Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                              const Text('Outstanding Debt', style: TextStyle(fontSize: 10, color: Colors.grey)),
                            ],
                          ),
                          onTap: () => _showCustomerDetails(context, customer),
                        );
                      },
                    ),
                  ),
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
        Expanded(
          child: _buildStatCard('Total Outstanding', 'OMR ${totalDebt.toStringAsFixed(3)}', Colors.red),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: _buildStatCard('Active Customers', '${customers.length}', Colors.blue),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          const SizedBox(height: 5),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  void _showAddCustomerDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Customer'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Customer Name')),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone (WhatsApp)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final newCustomer = Customer(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                name: nameController.text,
                phone: phoneController.text,
              );
              ref.read(customerServiceProvider).addCustomer(newCustomer);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
  
  void _showCustomerDetails(BuildContext context, Customer customer) {
     // Show transaction history, send WhatsApp reminder button, etc.
     showModalBottomSheet(
       context: context,
       builder: (context) => Padding(
         padding: const EdgeInsets.all(20),
         child: Column(
           mainAxisSize: MainAxisSize.min,
           children: [
             Text(customer.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
             const SizedBox(height: 10),
             Text('Debt: OMR ${customer.totalDebt.toStringAsFixed(3)}', style: const TextStyle(color: Colors.red, fontSize: 18)),
             const SizedBox(height: 20),
             ElevatedButton.icon(
               onPressed: () {
                  // Logic to send WhatsApp reminder
               },
               icon: const Icon(Icons.message),
               label: const Text('Send WhatsApp Reminder'),
               style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
             ),
             const SizedBox(height: 10),
             OutlinedButton(
               onPressed: () => Navigator.pop(context),
               style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
               child: const Text('Close'),
             ),
           ],
         ),
       ),
     );
  }
}
