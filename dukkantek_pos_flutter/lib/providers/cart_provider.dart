import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/cart_item.dart';

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addToCart(Product product, {double quantity = 1.0}) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      // Update quantity if already in cart
      state = [
        for (final item in state)
          if (item.product.id == product.id)
            CartItem(product: item.product, quantity: item.quantity + quantity)
          else
            item
      ];
    } else {
      // Add new item
      state = [...state, CartItem(product: product, quantity: quantity)];
    }
  }

  void removeFromCart(Product product) {
    state = state.where((item) => item.product.id != product.id).toList();
  }

  void decrementQuantity(Product product) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      final currentQty = state[existingIndex].quantity;
      if (currentQty > 1) {
        state = [
          for (final item in state)
            if (item.product.id == product.id)
              CartItem(product: item.product, quantity: item.quantity - 1)
            else
              item
        ];
      } else {
        removeFromCart(product);
      }
    }
  }

  void updateQuantity(Product product, double newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(product);
      return;
    }
    state = [
      for (final item in state)
        if (item.product.id == product.id)
          CartItem(product: item.product, quantity: newQuantity)
        else
          item
    ];
  }

  void clearCart() {
    state = [];
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

final cartTotalProvider = Provider<double>((ref) {
  final cart = ref.watch(cartProvider);
  return cart.fold(0, (sum, item) => sum + item.total);
});
