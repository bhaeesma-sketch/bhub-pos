import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:dukkantek_pos_flutter/services/sales_service.dart';
import 'package:dukkantek_pos_flutter/services/firestore_service.dart';
import 'package:dukkantek_pos_flutter/services/customer_service.dart';
import 'package:dukkantek_pos_flutter/models/customer.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/providers/cart_provider.dart';
import 'package:dukkantek_pos_flutter/services/printer_service.dart';

final productsStreamProvider = StreamProvider<List<Product>>((ref) {
  return ref.watch(inventoryServiceProvider).getProducts();
});

final customersProvider = StreamProvider<List<Customer>>((ref) {
  return ref.watch(customerServiceProvider).getCustomers();
});

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({super.key});

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen> {
  final FocusNode _keyboardFocusNode = FocusNode();
  String _barcodeBuffer = '';
  Customer? _selectedCustomer;
  String _activeCategory = 'All Items';

  @override
  void dispose() {
    _keyboardFocusNode.dispose();
    super.dispose();
  }

  void _handleKeyEvent(RawKeyEvent event) {
    if (event is RawKeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.enter) {
        if (_barcodeBuffer.isNotEmpty) {
          _processBarcode(_barcodeBuffer);
          _barcodeBuffer = '';
        }
      } else if (event.data.logicalKey.keyLabel.length == 1) {
        _barcodeBuffer += event.data.logicalKey.keyLabel;
      }
    }
  }

  void _processBarcode(String barcode) {
    final products = ref.read(productsStreamProvider).valueOrNull ?? [];
    try {
      final product = products.firstWhere((p) => p.barcode == barcode);
      ref.read(cartProvider.notifier).addToCart(product);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Product not found: $barcode'),
        backgroundColor: Colors.redAccent,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsStreamProvider);
    final customersAsync = ref.watch(customersProvider);
    final cartTotal = ref.watch(cartTotalProvider);
    final vat = cartTotal * 0.05;
    final finalTotal = cartTotal + vat;

    return RawKeyboardListener(
      focusNode: _keyboardFocusNode,
      autofocus: true,
      onKey: _handleKeyEvent,
      child: Scaffold(
        backgroundColor: const Color(0xFFF1F5F9), // Slate 100
        body: Row(
          children: [
            // LEFT: Product Management Area
            Expanded(
              flex: 12,
              child: Column(
                children: [
                  _buildTopBar(),
                  _buildCategoryBar(),
                  Expanded(
                    child: productsAsync.when(
                      data: (products) {
                        final filtered = _activeCategory == 'All Items'
                            ? products
                            : products.where((p) => p.category == _activeCategory).toList();
                        return GridView.builder(
                          padding: const EdgeInsets.all(20),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            childAspectRatio: 0.8,
                            crossAxisSpacing: 15,
                            mainAxisSpacing: 15,
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) => ProductCard(
                            product: filtered[index],
                            onTap: () => ref.read(cartProvider.notifier).addToCart(filtered[index]),
                          ),
                        );
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, s) => Center(child: Text('Error: $e')),
                    ),
                  ),
                ],
              ),
            ),
            
            // RIGHT: Billing Sidebar
            Container(
              width: 420,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(left: BorderSide(color: Colors.slate.shade200)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(-5, 0),
                  )
                ],
              ),
              child: Column(
                children: [
                  _buildCartHeader(),
                  Expanded(child: _buildCartList()),
                  _buildCustomerSelection(customersAsync),
                  _buildCheckoutSection(cartTotal, vat, finalTotal),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search or Scan Barcode...',
                prefixIcon: const Icon(Icons.search, color: Colors.slate),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.slate.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.slate.shade200),
                ),
              ),
              onSubmitted: _processBarcode,
            ),
          ),
          const SizedBox(width: 15),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.wifi, size: 16, color: Colors.green),
                const SizedBox(width: 8),
                Text("Online", style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBar() {
    final categories = ['All Items', 'Beverages', 'Dairy', 'Snacks', 'Bakery', 'Produce', 'Cleaning'];
    return Container(
      height: 60,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final cat = categories[index];
          final isActive = _activeCategory == cat;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 5),
            child: InkWell(
              onTap: () => setState(() => _activeCategory = cat),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isActive ? Colors.green : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isActive ? Colors.green : Colors.slate.shade100),
                ),
                child: Text(
                  cat,
                  style: TextStyle(
                    color: isActive ? Colors.white : Colors.slate.shade600,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCartHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        border: Border(bottom: BorderSide(color: Colors.slate.shade100)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text("Current Sale", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
          TextButton(
            onPressed: () => ref.read(cartProvider.notifier).clearCart(),
            child: const Text("Clear All", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    final cart = ref.watch(cartProvider);
    if (cart.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 48, color: Colors.slate.shade200),
            const SizedBox(height: 10),
            Text("Cart is empty", style: TextStyle(color: Colors.slate.shade300, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(10),
      itemCount: cart.length,
      itemBuilder: (context, index) {
        final item = cart[index];
        return Container(
          margin: const EdgeInsets.bottom(10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.slate.shade100),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 5)],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                    Text("${item.product.price.toStringAsFixed(3)} x ${item.quantity.toInt()}", style: TextStyle(color: Colors.slate.shade400, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              Text("OMR ${item.total.toStringAsFixed(3)}", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green)),
              const SizedBox(width: 10),
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, size: 20, color: Colors.redAccent),
                onPressed: () => ref.read(cartProvider.notifier).decrementQuantity(item.product),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCustomerSelection(AsyncValue<List<Customer>> customersAsync) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        border: Border(top: BorderSide(color: Colors.slate.shade100)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Select Customer (Khat)", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate)),
          const SizedBox(height: 5),
          customersAsync.when(
            data: (customers) => DropdownButton<Customer>(
              isExpanded: true,
              underline: const SizedBox(),
              hint: Text("Select Client...", style: TextStyle(fontSize: 12, color: Colors.slate.shade400)),
              value: _selectedCustomer,
              items: customers.map((c) => DropdownMenuItem(value: c, child: Text(c.name, style: const TextStyle(fontSize: 12)))).toList(),
              onChanged: (val) => setState(() => _selectedCustomer = val),
            ),
            loading: () => const LinearProgressIndicator(),
            error: (e, s) => const Text("Error loading clients"),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutSection(double subtotal, double vat, double total) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.slate.shade200)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Subtotal", style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 11)),
              Text("OMR ${subtotal.toStringAsFixed(3)}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("VAT (5% Incl.)", style: TextStyle(color: Colors.slate.shade400, fontWeight: FontWeight.bold, fontSize: 11)),
              Text("OMR ${vat.toStringAsFixed(3)}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
            ],
          ),
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("TOTAL AMOUNT", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF0F172A))),
              Text("OMR ${total.toStringAsFixed(3)}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, italic: true, color: Color(0xFF0F172A))),
            ],
          ),
          const SizedBox(height: 20),
          // PAYMENT GRID
          Row(
            children: [
              Expanded(child: _buildPayButton("CASH", Colors.green, Icons.money, () => _checkout(total, 'Cash'))),
              const SizedBox(width: 8),
              Expanded(child: _buildPayButton("CARD", Colors.blue, Icons.credit_card, () => _checkout(total, 'Card'))),
              const SizedBox(width: 8),
              Expanded(child: _buildPayButton("KHAT", const Color(0xFFD4AF37), Icons.book, () {
                if (_selectedCustomer == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please select a customer for Khat sale")));
                  return;
                }
                _checkout(total, 'Khat/Daftar', isCredit: true);
              })),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPayButton(String label, Color color, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 70,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border(bottom: BorderSide(color: color.withOpacity(0.5), width: 4)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 10)),
          ],
        ),
      ),
    );
  }

  Future<void> _checkout(double total, String method, {bool isCredit = false}) async {
    if (total <= 0) return;
    
    final cart = ref.read(cartProvider);
    final saleItems = cart.map((item) => SaleItem(
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      price: item.product.price,
      quantity: item.quantity,
      cost: item.product.cost,
    )).toList();

    showDialog(context: context, barrierDismissible: false, builder: (ctx) => const Center(child: CircularProgressIndicator()));
    
    try {
      final sale = await ref.read(salesServiceProvider).processSale(
        items: saleItems,
        total: total,
        paymentMethod: method,
        customerId: _selectedCustomer?.id,
        isCredit: isCredit,
      );

      Navigator.pop(context); // Close loading
      
      _showReceiptOptions(sale);
      
      ref.read(cartProvider.notifier).clearCart();
      setState(() {
        _selectedCustomer = null;
      });
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showReceiptOptions(Sale sale) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("SALE COMPLETE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.print, color: Colors.blue),
              title: const Text("Print Receipt (80mm)", style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                PrinterService().printReceipt(sale);
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.message, color: Colors.green),
              title: const Text("Share on WhatsApp", style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                PrinterService().shareReceiptViaWhatsApp(sale, _selectedCustomer?.phone ?? '');
                Navigator.pop(ctx);
              },
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text("DONE"),
              ),
            )
          ],
        ),
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  const ProductCard({super.key, required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.slate.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.slate.shade50,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Center(
                  child: Icon(Icons.shopping_bag_outlined, size: 40, color: Colors.slate.shade200),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, overflow: TextOverflow.ellipsis)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("OMR ${product.price.toStringAsFixed(3)}", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 12)),
                      Text("${product.stock.toInt()} IN", style: TextStyle(color: Colors.slate.shade300, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
