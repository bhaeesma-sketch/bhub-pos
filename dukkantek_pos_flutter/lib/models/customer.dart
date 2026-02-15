class Customer {
  final String id;
  final String name;
  final String phone;
  final double totalDebt;
  final List<String> creditSaleIds;

  Customer({
    required this.id,
    required this.name,
    required this.phone,
    this.totalDebt = 0.0,
    this.creditSaleIds = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'totalDebt': totalDebt,
      'creditSaleIds': creditSaleIds,
    };
  }

  factory Customer.fromMap(Map<String, dynamic> map, String documentId) {
    return Customer(
      id: documentId,
      name: map['name'] ?? '',
      phone: map['phone'] ?? '',
      totalDebt: (map['totalDebt'] ?? 0.0).toDouble(),
      creditSaleIds: List<String>.from(map['creditSaleIds'] ?? []),
    );
  }
}
