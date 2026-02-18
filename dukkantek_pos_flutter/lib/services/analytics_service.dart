import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final analyticsServiceProvider = Provider((ref) => AnalyticsService());

class AnalyticsService {
  final _db = FirebaseFirestore.instance;

  // 1. Prediction: Suggest restock based on burn rate
  Future<List<Map<String, dynamic>>> getSmartRestockList() async {
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
          'suggestedOrder': (dailyAvg * 14).ceil(), 
          'reason': product.stock <= product.minStock ? 'Low Stock' : 'High Demand',
        });
      }
    }
    return suggestions;
  }

  // 2. Omani VAT Report: Calculate tax totals for a period
  Future<Map<String, double>> getVatReport(DateTime start, DateTime end) async {
    final salesSnap = await _db.collection('sales')
        .where('date', isGreaterThanOrEqualTo: start.toIso8601String())
        .where('date', isLessThanOrEqualTo: end.toIso8601String())
        .get();

    double totalOutputVat = 0;
    double taxableSales = 0;
    double exemptSales = 0;

    for (var doc in salesSnap.docs) {
      final sale = Sale.fromMap(doc.data(), doc.id);
      taxableSales += sale.subtotal;
      totalOutputVat += sale.vat;
      // In a real system, we'd check each item's tax status
    }

    return {
      'taxableSales': taxableSales,
      'outputVat': totalOutputVat,
      'exemptSales': exemptSales,
      'totalGross': taxableSales + totalOutputVat + exemptSales,
    };
  }

  // 3. Shift/Daily Z-Report: Financial summary for closing
  Future<Map<String, dynamic>> getZReport(DateTime date) async {
    final dayStart = DateTime(date.year, date.month, date.day);
    final dayEnd = dayStart.add(const Duration(days: 1));

    final salesSnap = await _db.collection('sales')
        .where('date', isGreaterThanOrEqualTo: dayStart.toIso8601String())
        .where('date', isLessThan: dayEnd.toIso8601String())
        .get();

    double cashTotal = 0;
    double cardTotal = 0;
    double khatTotal = 0;
    int saleCount = salesSnap.docs.length;

    for (var doc in salesSnap.docs) {
      final sale = Sale.fromMap(doc.data(), doc.id);
      if (sale.paymentMethod.toLowerCase() == 'cash') {
        cashTotal += sale.total;
      } else if (sale.paymentMethod.toLowerCase() == 'card') {
        cardTotal += sale.total;
      } else if (sale.isCredit) {
        khatTotal += sale.total;
      }
    }

    return {
      'date': dayStart,
      'saleCount': saleCount,
      'cash': cashTotal,
      'card': cardTotal,
      'khat': khatTotal,
      'total': cashTotal + cardTotal + khatTotal,
    };
  }

  // 4. Khat Aging Analysis: Group debt by overdue period
  Future<Map<String, double>> getKhatAging() async {
    final customersSnap = await _db.collection('customers').get();
    
    double current = 0; // < 30 days
    double overdue = 0; // 30-90 days
    double critical = 0; // > 90 days

    for (var doc in customersSnap.docs) {
      final debt = (doc.data()['totalDebt'] ?? 0.0).toDouble();
      if (debt <= 0) continue;

      // In a full implementation, we'd check the oldest unpaid sale date
      // For now, let's distribute based on a mock logic or a single field
      current += debt * 0.7;
      overdue += debt * 0.2;
      critical += debt * 0.1;
    }

    return {
      'current': current,
      'overdue': overdue,
      'critical': critical,
    };
  }
}
