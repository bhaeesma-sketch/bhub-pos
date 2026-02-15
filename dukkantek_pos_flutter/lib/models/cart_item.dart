import 'package:dukkantek_pos_flutter/models/product.dart';

class CartItem {
  final Product product;
  final double quantity;

  const CartItem({
    required this.product,
    this.quantity = 1.0,
  });

  double get total => product.price * quantity;
  
  CartItem copyWith({Product? product, double? quantity}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }
}
