import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:dukkantek_pos_flutter/services/analytics_service.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final analytics = ref.watch(analyticsServiceProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 100
      appBar: AppBar(
        title: const Text('Compliance & Financial Reports', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today, color: Colors.slate, size: 20),
            onPressed: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime(2025),
                lastDate: DateTime.now(),
              );
              if (date != null) setState(() => _selectedDate = date);
            },
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Daily Financial Summary (Z-Report)
            const Text('DAILY Z-REPORT SUMMARY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
            const SizedBox(height: 20),
            FutureBuilder<Map<String, dynamic>>(
              future: analytics.getZReport(_selectedDate),
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: LinearProgressIndicator());
                final data = snapshot.data!;
                return Container(
                  padding: const EdgeInsets.all(25),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.slate.shade100)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildReportItem('Transaction Count', '${data['saleCount']}', Colors.slate),
                          _buildReportItem('Cash Total', 'OMR ${data['cash'].toStringAsFixed(3)}', Colors.green),
                          _buildReportItem('Card Total', 'OMR ${data['card'].toStringAsFixed(3)}', Colors.blue),
                          _buildReportItem('Khat Revenue', 'OMR ${data['khat'].toStringAsFixed(3)}', Colors.orange),
                        ],
                      ),
                      const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider()),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('NET DAILY REVENUE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          Text('OMR ${data['total'].toStringAsFixed(3)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: Color(0xFF0F172A))),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 40),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // VAT Compliance Report
                Expanded(
                  flex: 1,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('VAT COMPLIANCE (OMAN ITA)', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
                      const SizedBox(height: 20),
                      FutureBuilder<Map<String, double>>(
                        future: analytics.getVatReport(_selectedDate, _selectedDate),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const Center(child: LinearProgressIndicator());
                          final vat = snapshot.data!;
                          return Container(
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.slate.shade100)),
                            child: Column(
                              children: [
                                _buildSimpleRow('Taxable Sales (5%)', 'OMR ${vat['taxableSales']?.toStringAsFixed(3)}'),
                                const SizedBox(height: 10),
                                _buildSimpleRow('Zero-Rated Sales', 'OMR 0.000'),
                                const SizedBox(height: 10),
                                _buildSimpleRow('Exempt Sales', 'OMR ${vat['exemptSales']?.toStringAsFixed(3)}'),
                                const Divider(height: 30),
                                _buildSimpleRow('Output VAT Collected', 'OMR ${vat['outputVat']?.toStringAsFixed(3)}', isBold: true, color: Colors.red),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 30),
                // Khat Aging Report
                Expanded(
                  flex: 1,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('KHAT DEBT AGING', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
                      const SizedBox(height: 20),
                      FutureBuilder<Map<String, double>>(
                        future: analytics.getKhatAging(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const Center(child: LinearProgressIndicator());
                          final aging = snapshot.data!;
                          return Container(
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.slate.shade100)),
                            child: Column(
                              children: [
                                _buildSimpleRow('Current (< 30 Days)', 'OMR ${aging['current']?.toStringAsFixed(3)}', color: Colors.green),
                                const SizedBox(height: 10),
                                _buildSimpleRow('Overdue (30-90 Days)', 'OMR ${aging['overdue']?.toStringAsFixed(3)}', color: Colors.orange),
                                const SizedBox(height: 10),
                                _buildSimpleRow('Critical (> 90 Days)', 'OMR ${aging['critical']?.toStringAsFixed(3)}', color: Colors.red),
                                const Divider(height: 30),
                                _buildSimpleRow('TOTAL RECEIVABLES', 'OMR ${(aging.values.fold(0.0, (a, b) => a + b)).toStringAsFixed(3)}', isBold: true),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 40),
            
            // Export Section
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildExportButton('EXPORT ITA VAT REPORT (XLS)', Icons.description_outlined, Colors.blue),
                const SizedBox(width: 20),
                _buildExportButton('PRINT DAY Z-REPORT (PDF)', Icons.print_outlined, const Color(0xFF0F172A)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 11)),
        const SizedBox(height: 5),
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color)),
      ],
    );
  }

  Widget _buildSimpleRow(String label, String value, {bool isBold = false, Color color = const Color(0xFF0F172A)}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: isBold ? const Color(0xFF0F172A) : Colors.slate.shade600, fontWeight: isBold ? FontWeight.w900 : FontWeight.bold, fontSize: 12)),
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: color)),
      ],
    );
  }

  Widget _buildExportButton(String label, IconData icon, Color color) {
    return ElevatedButton.icon(
      onPressed: () {},
      icon: Icon(icon, size: 18),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
