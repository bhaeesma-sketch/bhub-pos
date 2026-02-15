import 'package:dukkantek_pos_flutter/models/product.dart';

class SaleItem {
  final String productId;
  final String productName;
  final String category; // Added for category analytics
  final double price;
  final double cost; // Track COGS
  final double quantity;

  SaleItem({
    required this.productId,
    required this.productName,
    required this.category,
    required this.price,
    this.cost = 0.0,
    required this.quantity,
  });
  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'productName': productName,
      'category': category,
      'price': price,
      'cost': cost,
      'quantity': quantity,
    };
  }

  factory SaleItem.fromMap(Map<String, dynamic> map) {
    return SaleItem(
      productId: map['productId'] ?? '',
      productName: map['productName'] ?? 'Unknown',
      category: map['category'] ?? 'General',
      price: (map['price'] ?? 0.0).toDouble(),
      cost: (map['cost'] ?? 0.0).toDouble(),
      quantity: (map['quantity'] ?? 1.0).toDouble(),
    );
  }

  double get total => price * quantity;
  double get profit => (price - cost) * quantity;
}

class Sale {
  final String id; // Transaction ID
  final DateTime date;
  final List<SaleItem> items;
  final double subtotal;
  final double vat;
  final double total;
  final String paymentMethod; // Cash, Card
  final String staffId;
  final String? customerId; // Linked to Customer model
  final bool isCredit; // If true, this is a "Khat" sale

  Sale({
    required this.id,
    required this.date,
    required this.items,
    required this.subtotal,
    required this.vat,
    required this.total,
    required this.paymentMethod,
    required this.staffId,
    this.customerId,
    this.isCredit = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'items': items.map((i) => i.toMap()).toList(),
      'subtotal': subtotal,
      'vat': vat,
      'total': total,
      'paymentMethod': paymentMethod,
      'staffId': staffId,
      'customerId': customerId,
      'isCredit': isCredit,
    };
  }

  factory Sale.fromMap(Map<String, dynamic> map, String id) {
    return Sale(
      id: id,
      date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
      items: (map['items'] as List<dynamic>?)
          ?.map((x) => SaleItem.fromMap(x as Map<String, dynamic>))
          .toList() ?? [],
      subtotal: (map['subtotal'] ?? 0.0).toDouble(),
      vat: (map['vat'] ?? 0.0).toDouble(),
      total: (map['total'] ?? 0.0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'Cash',
      staffId: map['staffId'] ?? '',
      customerId: map['customerId'],
      isCredit: map['isCredit'] ?? false,
    );
  }
}
