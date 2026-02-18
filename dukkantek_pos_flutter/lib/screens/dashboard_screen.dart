import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/sales_service.dart';
import 'package:dukkantek_pos_flutter/services/analytics_service.dart';
import 'pos_screen.dart';
import 'inventory_screen.dart';
import 'customers_screen.dart';
import 'reports_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _screens = [
    HomeDashboardTab(),
    PosScreen(),
    InventoryScreen(),
    CustomersScreen(),
    ReportsScreen(),
    Center(child: Text("Settings Coming Soon", style: TextStyle(color: Colors.slate))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 100
      body: Row(
        children: [
          NavigationRail(
            backgroundColor: Colors.white,
            selectedIndex: _selectedIndex,
            onDestinationSelected: (int index) => setState(() => _selectedIndex = index),
            labelType: NavigationRailLabelType.all,
            indicatorColor: Colors.slate.shade100,
            selectedLabelTextStyle: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 10),
            unselectedLabelTextStyle: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 10),
            leading: const Padding(
              padding: EdgeInsets.symmetric(vertical: 30),
              child: Icon(FontAwesomeIcons.cashRegister, size: 28, color: Color(0xFFD4AF37)),
            ),
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: Text('Home')),
              NavigationRailDestination(icon: Icon(Icons.point_of_sale_outlined), selectedIcon: Icon(Icons.point_of_sale), label: Text('POS')),
              NavigationRailDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: Text('Stock')),
              NavigationRailDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: Text('Khat')),
              NavigationRailDestination(icon: Icon(Icons.analytics_outlined), selectedIcon: Icon(Icons.analytics), label: Text('Reports')),
              NavigationRailDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: Text('Settings')),
            ],
          ),
          const VerticalDivider(thickness: 1, width: 1, color: Color(0xFFE2E8F0)),
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
    );
  }
}

class HomeDashboardTab extends ConsumerWidget {
  const HomeDashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesStream = ref.watch(salesServiceProvider).getRecentSales();
    final analytics = ref.watch(analyticsServiceProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(30),
      child: StreamBuilder<List<Sale>>(
        stream: salesStream,
        builder: (context, snapshot) {
          final sales = snapshot.data ?? [];
          final totalRevenue = sales.fold(0.0, (sum, sale) => sum + sale.total);
          
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Business Intelligence', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
              const SizedBox(height: 5),
              Text('Overview of your shop performance today', style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold)),
              const SizedBox(height: 30),
              
              Row(
                children: [
                  _buildKpiCard('Daily Revenue', 'OMR ${totalRevenue.toStringAsFixed(3)}', Icons.payments_outlined, Colors.green),
                  const SizedBox(width: 20),
                  _buildKpiCard('Orders', '${sales.length}', Icons.shopping_basket_outlined, Colors.blue),
                  const SizedBox(width: 20),
                  _buildKpiCard('Active Debt', 'OMR 45.200', Icons.account_balance_wallet_outlined, Colors.red),
                ],
              ),

              const SizedBox(height: 40),
              
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildChartSection(context),
                  ),
                  const SizedBox(width: 30),
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('AI STOCK ALERTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
                        const SizedBox(height: 15),
                        FutureBuilder(
                          future: analytics.getSmartRestockList(),
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) return const LinearProgressIndicator();
                            final items = snapshot.data as List<Map<String, dynamic>>;
                            if (items.isEmpty) return const Text("Inventory fully stocked", style: TextStyle(color: Colors.slate, fontSize: 12));
                            return Column(
                              children: items.take(3).map((item) {
                                final p = item['product'] as Product;
                                return Container(
                                  margin: const EdgeInsets.bottom(10),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.slate.shade100)),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 15),
                                    title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                    subtitle: Text("Order +${item['suggestedOrder']} units", style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                                    trailing: const Icon(Icons.arrow_upward, color: Colors.green, size: 16),
                                  ),
                                );
                              }).toList(),
                            );
                          },
                        ),
                        const SizedBox(height: 30),
                        const Text('EXPIRY TRACKER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A), trackingWidest: 1.5)),
                        const SizedBox(height: 15),
                        Container(
                          decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.orange.shade100)),
                          child: const ListTile(
                            title: Text("Greek Yogurt x10", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                            subtitle: Text("Expires in 3 days!", style: TextStyle(fontSize: 10, color: Colors.orange, fontWeight: FontWeight.bold)),
                            trailing: Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildChartSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.slate.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Weekly Revenue Flow', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.slate.shade50, borderRadius: BorderRadius.circular(8)),
                child: const Text('Last 7 Days', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.slate)),
              ),
            ],
          ),
          const SizedBox(height: 30),
          SizedBox(
            height: 250,
            child: BarChart(
              BarChartData(
                borderData: FlBorderData(show: false),
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: Colors.slate.shade50, strokeWidth: 1)),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, m) => Text('${v.toInt()}', style: TextStyle(color: Colors.slate.shade300, fontSize: 10, fontWeight: FontWeight.bold)))),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, m) => Padding(padding: const EdgeInsets.only(top: 10), child: Text(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][v.toInt() % 7], style: TextStyle(color: Colors.slate.shade400, fontSize: 10, fontWeight: FontWeight.bold))))),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                barGroups: [
                  _makeGroupData(0, 500, Colors.blue), _makeGroupData(1, 800, Colors.blue), _makeGroupData(2, 600, Colors.blue),
                  _makeGroupData(3, 1200, const Color(0xFFD4AF37)), _makeGroupData(4, 900, Colors.blue), _makeGroupData(5, 1100, Colors.blue),
                  _makeGroupData(6, 400, Colors.blue),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeGroupData(int x, double y, Color color) {
    return BarChartGroupData(x: x, barRods: [BarChartRodData(toY: y, color: color, width: 22, borderRadius: const BorderRadius.vertical(top: Radius.circular(6)))]);
  }

  Widget _buildKpiCard(String title, String value, IconData icon, Color color) {
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
}
