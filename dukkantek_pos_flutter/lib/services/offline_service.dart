import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:connectivity_plus/connectivity_plus.dart'; // We need this in pubspec for better offline detection

final offlineServiceProvider = Provider<OfflineService>((ref) {
  return OfflineService();
});

class OfflineService {
  static const String productBoxName = 'products_box';
  static const String saleQueueBoxName = 'sale_queue_box';

  Future<void> init() async {
    // Already inited in main, but good to be safe
    // if (!Hive.isAdapterRegistered(0)) Hive.registerAdapter(ProductAdapter());
    // if (!Hive.isAdapterRegistered(1)) Hive.registerAdapter(SaleItemAdapter());
    // if (!Hive.isAdapterRegistered(2)) Hive.registerAdapter(SaleAdapter());
    
    await Hive.openBox<Product>(productBoxName);
    await Hive.openBox<Sale>(saleQueueBoxName);
  }

  // --- Products Cache ---

  List<Product> getCachedProducts() {
    final box = Hive.box<Product>(productBoxName);
    return box.values.toList();
  }

  Future<void> cacheProducts(List<Product> products) async {
    final box = Hive.box<Product>(productBoxName);
    await box.clear();
    final Map<String, Product> productMap = {for (var p in products) p.id: p};
    await box.putAll(productMap);
  }

  // --- Sales Queue ---

  Future<void> queueSale(Sale sale) async {
    final box = Hive.box<Sale>(saleQueueBoxName);
    await box.add(sale);
  }

  List<Sale> getQueuedSales() {
    final box = Hive.box<Sale>(saleQueueBoxName);
    return box.values.toList();
  }

  Future<void> clearQueue() async {
    final box = Hive.box<Sale>(saleQueueBoxName);
    await box.clear();
  }
  
  Future<void> removeSaleFromQueue(dynamic key) async {
      final box = Hive.box<Sale>(saleQueueBoxName);
      await box.delete(key);
  }

  // --- Network Monitor & Sync Logic ---
  
  Future<bool> isOnline() async {
    final connectivityResult = await (Connectivity().checkConnectivity());
    if (connectivityResult == ConnectivityResult.none) {
      return false;
    }
    // Optional: Ping google.com to be sure
    return true;
  }
}

// Provider to watch network status
final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  return Connectivity().onConnectivityChanged;
});
