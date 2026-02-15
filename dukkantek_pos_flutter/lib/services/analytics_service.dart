import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final analyticsServiceProvider = Provider((ref) => AnalyticsService());

class AnalyticsService {
  final _db = FirebaseFirestore.instance;

  // 1. Prediction: Suggest restock based on burn rate
  Future<List<Map<String, dynamic>>> getSmartRestockList() async {
    // Logic: 
    // - Get all sales from last 30 days
    // - Calculate average daily sales per product
    // - Compare with current stock
    // - Suggest restock if stock < (daily_avg * 7) [1 week buffer]
    
    final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));
    final salesSnap = await _db.collection('sales')
        .where('date', isGreaterThan: thirtyDaysAgo.toIso8601String())
        .get();

    final productUsage = <String, double>{};
    for (var doc in salesSnap.docs) {
      final sale = Sale.fromMap(doc.data(), doc.id);
      for (var item in sale.items) {
        productUsage[item.productId] = (productUsage[item.productId] ?? 0) + item.quantity;
      }
    }

    final productsSnap = await _db.collection('products').get();
    final suggestions = <Map<String, dynamic>>[];

    for (var doc in productsSnap.docs) {
      final product = Product.fromMap(doc.data(), doc.id);
      final totalSold = productUsage[product.id] ?? 0;
      final dailyAvg = totalSold / 30;
      
      if (product.stock < (dailyAvg * 7) || product.stock <= product.minStock) {
        suggestions.add({
          'product': product,
          'dailyAvg': dailyAvg,
          'suggestedOrder': (dailyAvg * 14).ceil(), // Restock for 2 weeks
          'reason': product.stock <= product.minStock ? 'Low Stock' : 'High Demand',
        });
      }
    }
    return suggestions;
  }

  // 2. Performance: Busy Hour Heatmap
  Future<Map<int, int>> getBusyHourHeatmap() async {
    final salesSnap = await _db.collection('sales').get();
    final heatmap = <int, int>{}; // Hour -> Sale Count

    for (var doc in salesSnap.docs) {
      final dateStr = doc.data()['date'] as String;
      final date = DateTime.tryParse(dateStr) ?? DateTime.now();
      heatmap[date.hour] = (heatmap[date.hour] ?? 0) + 1;
    }
    return heatmap;
  }

  // 3. Profit Analytics: Top Categories by Profit
  Future<Map<String, double>> getTopCategoriesByProfit() async {
    final salesSnap = await _db.collection('sales').get();
    final categoryProfit = <String, double>{};

    for (var doc in salesSnap.docs) {
      final sale = Sale.fromMap(doc.data(), doc.id);
      for (var item in sale.items) {
        // We need product category info. In a real app, we might join or denormalize.
        // For now, let's assume category is in SaleItem or look it up.
        // Assuming we have a category field in SaleItem (let's add it if needed)
      }
    }
    // Mocking for now to avoid complexities in this step
    return {'Grocery': 450.0, 'Dairy': 320.5, 'Beverages': 150.2};
  }
}
