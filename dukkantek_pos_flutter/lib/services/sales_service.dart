import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dukkantek_pos_flutter/services/firestore_service.dart';
import 'package:dukkantek_pos_flutter/services/offline_service.dart';
import 'package:uuid/uuid.dart';

final salesServiceProvider = Provider<SalesService>((ref) {
  // Use Firestore implementation for production-ready logic
  return FirestoreSalesService(); 
});

abstract class SalesService {
  Future<Sale> processSale({
    required List<SaleItem> items,
    required double total,
    required String paymentMethod,
    String? customerId,
    bool isCredit = false,
  });
  
  Stream<List<Sale>> getRecentSales();
}

class FirestoreSalesService implements SalesService {
  final _db = FirebaseFirestore.instance;

  @override
  Future<Sale> processSale({
    required List<SaleItem> items,
    required double total,
    required String paymentMethod,
    String? customerId,
    bool isCredit = false,
  }) async {
    // 1. Prepare Sale Data
    final subtotal = total / 1.05; 
    final vat = total - subtotal;

    final saleRef = _db.collection('sales').doc();
    final saleId = saleRef.id;

    final sale = Sale(
      id: saleId,
      date: DateTime.now(),
      items: items,
      subtotal: double.parse(subtotal.toStringAsFixed(3)),
      vat: double.parse(vat.toStringAsFixed(3)),
      total: double.parse(total.toStringAsFixed(3)),
      paymentMethod: paymentMethod,
      staffId: 'staff_1',
      customerId: customerId,
      isCredit: isCredit,
    );

    try {
      await _db.runTransaction((transaction) async {
        // 2. Decrement Stock
        for (final item in items) {
          final productRef = _db.collection('products').doc(item.productId);
          final snapshot = await transaction.get(productRef);
          if (snapshot.exists) {
            final currentStock = snapshot.data()?['stock'] as int? ?? 0;
            transaction.update(productRef, {'stock': currentStock - item.quantity});
          }
        }

        // 3. Update Customer Debt if Credit
        if (isCredit && customerId != null) {
          final customerRef = _db.collection('customers').doc(customerId);
          final custSnap = await transaction.get(customerRef);
          if (custSnap.exists) {
            final currentDebt = (custSnap.data()?['totalDebt'] ?? 0.0).toDouble();
            final creditSales = List<String>.from(custSnap.data()?['creditSaleIds'] ?? []);
            creditSales.add(saleId);
            transaction.update(customerRef, {
              'totalDebt': currentDebt + total,
              'creditSaleIds': creditSales,
            });
          }
        }

        // 4. Write Sale Record
        transaction.set(saleRef, sale.toMap());
      });
      
    } catch (e) {
      print("Online transaction failed: $e. Queuing offline.");
      final offlineService = OfflineService();
      await offlineService.queueSale(sale);
    }
    
    return sale;
  }

  @override
  Stream<List<Sale>> getRecentSales() {
    return _db.collection('sales')
      .orderBy('date', descending: true)
      .limit(20)
      .snapshots()
      .map((snapshot) {
        return snapshot.docs.map((doc) => Sale.fromMap(doc.data(), doc.id)).toList();
      });
  }
}

// -----------------------------------------------------------------------------
// Mock Implementation (Legacy / Fallback)
// -----------------------------------------------------------------------------
class MockSalesService implements SalesService {
  final Ref ref;
  final List<Sale> _mockSales = [];

  MockSalesService(this.ref);

  @override
  Future<Sale> processSale({
    required List<SaleItem> items,
    required double total,
    required String paymentMethod,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    final sale = Sale(
      id: "MOCK-${DateTime.now().millisecondsSinceEpoch}",
      date: DateTime.now(),
      items: items,
      subtotal: total / 1.05,
      vat: total - (total / 1.05),
      total: total,
      paymentMethod: paymentMethod,
      staffId: 'mock_staff',
    );
    _mockSales.add(sale);
    print("Mock Sale Processed: OMR ${total.toStringAsFixed(3)}");
    return sale;
  }

  @override
  Stream<List<Sale>> getRecentSales() {
    return Stream.value(_mockSales);
  }
}
