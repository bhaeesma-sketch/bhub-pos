import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/offline_service.dart';

// Use this provider to access inventory operations
final inventoryServiceProvider = Provider<InventoryService>((ref) {
  return FirestoreService(); 
});

abstract class InventoryService {
  Stream<List<Product>> getProducts();
  Future<void> addProduct(Product product);
  Future<void> updateProduct(Product product);
  Future<void> deleteProduct(String id);
}

// -----------------------------------------------------------------------------
// Real Firestore Implementation (Uncomment when Firebase is configured)
// -----------------------------------------------------------------------------
class FirestoreService implements InventoryService {
  final _db = FirebaseFirestore.instance;

  @override
  Stream<List<Product>> getProducts() {
    // Return a stream that:
    // 1. Emits cached products immediately (if any)
    // 2. Tries to fetch new products from Firestore
    // 3. Updates cache on success
    // 4. Handles errors gracefully by sticking to cache
    
    // Simple implementation: StreamBuilder will handle the stream. 
    // But we need to combine local + remote.
    
    // Using simple approach: Listen to Firestore, but if it fails (offline), use Hive.
    // However, Stream doesn't easily "fallback" inside the stream itself unless we manage it.
    
    // Better: Return Firestore snapshots, but intercept to cache.
    // If offline, Firestore has its own offline persistence? Yes!
    // Firebase Firestore ALREADY has offline persistence enabled by default.
    // So we don't STRICTLY need Hive for *Products* if we just trust Firestore SDK.
    // BUT the user asked for "Offline Support (Hive)". So I will implement Hive caching as requested,
    // which is useful if the user clears app data or valid Firestore cache expires/evicts.
    // Also, Hive is faster for synchronous lookups (like barcode scan).

    final offlineService = OfflineService();
    
    return _db.collection('products').snapshots().map((snapshot) {
      final products = snapshot.docs.map((doc) => Product.fromMap(doc.data(), doc.id)).toList();
      offlineService.cacheProducts(products); // Async cache update
      return products;
    }).handleError((error) {
       // On error (e.g. permission denied or critical failure), return cache?
       // Firestore SDK usually handles network errors by showing cached data automatically.
       // So this might only trigger on actual failures.
       print("Firestore Error: $error. Returning Hive cache.");
       return offlineService.getCachedProducts();
    });
  }

  @override
  Future<void> addProduct(Product product) async {
    await _db.collection('products').add(product.toMap());
  }

  @override
  Future<void> updateProduct(Product product) async {
    await _db.collection('products').doc(product.id).update(product.toMap());
  }

  @override
  Future<void> deleteProduct(String id) async {
    await _db.collection('products').doc(id).delete();
  }
}

// -----------------------------------------------------------------------------
// Mock Implementation for Testing UI (Matches Dukkantek features)
// -----------------------------------------------------------------------------
class MockInventoryService implements InventoryService {
  // In-memory list simulating database
  final List<Product> _mockDb = [
    Product(id: '1', name: 'Fresh Milk 1L', category: 'Dairy', price: 0.600, stock: 50, barcode: '123456', imageUrl: ''),
    Product(id: '2', name: 'Brown Bread', category: 'Bakery', price: 0.450, stock: 20, barcode: '789012', imageUrl: ''),
    Product(id: '3', name: 'Eggs (30pcs)', category: 'Dairy', price: 1.200, stock: 100, barcode: '345678', imageUrl: ''),
    Product(id: '4', name: 'Pepsi 330ml', category: 'Beverages', price: 0.150, stock: 200, barcode: '901234', imageUrl: ''),
  ];

  @override
  Stream<List<Product>> getProducts() {
    // Return mock data as a stream
    return Stream.value(_mockDb);
  }

  @override
  Future<void> addProduct(Product product) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    _mockDb.add(product);
  }

  @override
  Future<void> updateProduct(Product product) async {
    await Future.delayed(const Duration(milliseconds: 500));
    final index = _mockDb.indexWhere((p) => p.id == product.id);
    if (index != -1) {
      _mockDb[index] = product;
    }
  }

  @override
  Future<void> deleteProduct(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    _mockDb.removeWhere((p) => p.id == id);
  }
}
