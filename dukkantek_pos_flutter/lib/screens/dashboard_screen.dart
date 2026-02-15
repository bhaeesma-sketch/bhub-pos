import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/sales_service.dart';
import 'package:dukkantek_pos_flutter/services/analytics_service.dart';
import 'pos_screen.dart';

import 'customers_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _screens = [
    HomeDashboardTab(), // Overview
    PosScreen(),       // The main POS interface
    Center(child: Text("Inventory Management")),
    CustomersScreen(), // Index 3
    Center(child: Text("Advanced Analytics & Reports")),
    Center(child: Text("Settings")),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            onDestinationSelected: (int index) {
              setState(() {
                _selectedIndex = index;
              });
            },
            labelType: NavigationRailLabelType.all,
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Icon(FontAwesomeIcons.cashRegister, size: 30, color: Theme.of(context).primaryColor),
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
          const VerticalDivider(thickness: 1, width: 1),
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
      padding: const EdgeInsets.all(20),
      child: StreamBuilder<List<Sale>>(
        stream: salesStream,
        builder: (context, snapshot) {
          final sales = snapshot.data ?? [];
          final totalRevenue = sales.fold(0.0, (sum, sale) => sum + sale.total);
          
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Business Overview', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 20),
              
              Row(
                children: [
                  _buildKpiCard(context, 'Total Sales', 'OMR ${totalRevenue.toStringAsFixed(3)}', Icons.attach_money, Colors.green),
                  const SizedBox(width: 20),
                  _buildKpiCard(context, 'Orders', '${sales.length}', Icons.receipt, Colors.blue),
                  const SizedBox(width: 20),
                  _buildKpiCard(context, 'Active Debt', 'OMR 45.200', Icons.people_alt, Colors.red),
                ],
              ),

              const SizedBox(height: 30),
              
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildChartSection(context),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Smart Restock (AI)', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 10),
                        FutureBuilder(
                          future: analytics.getSmartRestockList(),
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) return const CircularProgressIndicator();
                            final items = snapshot.data as List<Map<String, dynamic>>;
                            if (items.isEmpty) return const Text("Inventory healthy");
                            return Column(
                              children: items.take(3).map((item) {
                                final p = item['product'] as Product;
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(p.name),
                                  subtitle: Text("Suggested: ${item['suggestedOrder']} units"),
                                  trailing: const Icon(Icons.arrow_circle_up, color: Colors.green),
                                );
                              }).toList(),
                            );
                          },
                        ),
                        const SizedBox(height: 20),
                        Text('Expiry Alerts', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 10),
                        const ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text("Greek Yogurt x10"),
                          subtitle: Text("Expires in 5 days!"),
                          trailing: Icon(Icons.event_busy, color: Colors.orange),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Weekly Revenue', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 10),
        Container(
          height: 300,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.withOpacity(0.2)),
          ),
          child: BarChart(
            BarChartData(
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40)),
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, m) => Text(['M','T','W','T','F','S','S'][v.toInt() % 7]))),
                topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              barGroups: [
                _makeGroupData(0, 500), _makeGroupData(1, 800), _makeGroupData(2, 600),
                _makeGroupData(3, 1200), _makeGroupData(4, 900), _makeGroupData(5, 1100),
                _makeGroupData(6, 400),
              ],
            ),
          ),
        ),
      ],
    );
  }

  BarChartGroupData _makeGroupData(int x, double y) {
    return BarChartGroupData(x: x, barRods: [BarChartRodData(toY: y, color: Colors.purple, width: 22, borderRadius: BorderRadius.circular(4))]);
  }

  Widget _buildKpiCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(width: 15),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.grey)),
                Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
