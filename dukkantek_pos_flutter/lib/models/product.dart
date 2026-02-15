class Product {
  final String id;
  final String name;
  final String category;
  final double price;
  final double cost; // Added for profit calc
  final String barcode; // Added for scanning
  final String imageUrl;
  final int stock;
  final int minStock; // Low stock alert level
  final DateTime? expiryDate; // Added for expiry alerts
  final DateTime? lastRestockDate; // Added for prediction

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    this.cost = 0.0,
    required this.barcode,
    required this.imageUrl,
    required this.stock,
    this.minStock = 5,
    this.expiryDate,
    this.lastRestockDate,
  });

  // Convert to Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'cost': cost,
      'barcode': barcode,
      'imageUrl': imageUrl,
      'stock': stock,
      'minStock': minStock,
      'expiryDate': expiryDate?.toIso8601String(),
      'lastRestockDate': lastRestockDate?.toIso8601String(),
    };
  }

  // Create from Firestore Document
  factory Product.fromMap(Map<String, dynamic> map, String documentId) {
    return Product(
      id: documentId,
      name: map['name'] ?? '',
      category: map['category'] ?? 'General',
      price: (map['price'] ?? 0.0).toDouble(),
      cost: (map['cost'] ?? 0.0).toDouble(),
      barcode: map['barcode'] ?? '',
      imageUrl: map['imageUrl'] ?? '',
      stock: map['stock'] ?? 0,
      minStock: map['minStock'] ?? 5,
      expiryDate: map['expiryDate'] != null ? DateTime.tryParse(map['expiryDate']) : null,
      lastRestockDate: map['lastRestockDate'] != null ? DateTime.tryParse(map['lastRestockDate']) : null,
    );
  }
}
