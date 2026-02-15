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
  bool _isCredit = false;

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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Not found: $barcode')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsStreamProvider);
    final customersAsync = ref.watch(customersProvider);
    final cartTotal = ref.watch(cartTotalProvider);
    final finalTotal = cartTotal * 1.05;

    return RawKeyboardListener(
      focusNode: _keyboardFocusNode,
      autofocus: true,
      onKey: _handleKeyEvent,
      child: Scaffold(
        body: Row(
          children: [
            Expanded(
              flex: 13,
              child: Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: productsAsync.when(
                      data: (products) => GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 200, childAspectRatio: 0.85),
                        itemCount: products.length,
                        itemBuilder: (context, index) => ProductCard(
                          product: products[index],
                          onTap: () => ref.read(cartProvider.notifier).addToCart(products[index]),
                        ),
                      ),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, s) => Text('Error: $e'),
                    ),
                  ),
                ],
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(
              flex: 7,
              child: Column(
                children: [
                  _buildCustomerSelector(customersAsync),
                  Expanded(child: _buildCartList()),
                  _buildCheckoutSection(finalTotal),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        decoration: const InputDecoration(hintText: 'Search or Scan Barcode', prefixIcon: Icon(Icons.search), border: OutlineInputBorder()),
        onSubmitted: _processBarcode,
      ),
    );
  }

  Widget _buildCustomerSelector(AsyncValue<List<Customer>> customersAsync) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[100],
      child: Row(
        children: [
          const Icon(Icons.person_outline),
          const SizedBox(width: 10),
          Expanded(
            child: customersAsync.when(
              data: (customers) => DropdownButton<Customer>(
                isExpanded: true,
                hint: const Text("Select Customer (Khat)"),
                value: _selectedCustomer,
                items: customers.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                onChanged: (val) => setState(() => _selectedCustomer = val),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (e, s) => const Text("Error loading customers"),
            ),
          ),
          if (_selectedCustomer != null)
            IconButton(icon: const Icon(Icons.clear), onPressed: () => setState(() => _selectedCustomer = null)),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    final cart = ref.watch(cartProvider);
    return ListView.builder(
      itemCount: cart.length,
      itemBuilder: (context, index) => ListTile(
        title: Text(cart[index].product.name),
        subtitle: Text("${cart[index].quantity} x ${cart[index].product.price.toStringAsFixed(3)}"),
        trailing: Text("OMR ${cart[index].total.toStringAsFixed(3)}"),
      ),
    );
  }

  Widget _buildCheckoutSection(double total) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          if (_selectedCustomer != null)
            SwitchListTile(
              title: const Text("Is Credit Sale (Khat)?"),
              value: _isCredit,
              onChanged: (val) => setState(() => _isCredit = val),
            ),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("TOTAL (Inc. VAT)", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text("OMR ${total.toStringAsFixed(3)}", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple, foregroundColor: Colors.white),
              onPressed: total > 0 ? () => _checkout(total) : null,
              child: const Text("CHECKOUT", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _checkout(double total) async {
    final cart = ref.read(cartProvider);
    final saleItems = cart.map((item) => SaleItem(
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      price: item.product.price,
      quantity: item.quantity,
      cost: item.product.cost,
    )).toList();

    showDialog(context: context, builder: (ctx) => const Center(child: CircularProgressIndicator()));
    
    try {
      final sale = await ref.read(salesServiceProvider).processSale(
        items: saleItems,
        total: total,
        paymentMethod: _isCredit ? 'Credit' : 'Cash',
        customerId: _selectedCustomer?.id,
        isCredit: _isCredit,
      );

      Navigator.pop(context); // Close loading
      
      // WhatsApp Share if customer selected
      if (_selectedCustomer != null) {
        _showReceiptOptions(sale);
      } else {
        await PrinterService().printReceipt(sale);
      }
      
      ref.read(cartProvider.notifier).clearCart();
      setState(() {
        _selectedCustomer = null;
        _isCredit = false;
      });
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showReceiptOptions(Sale sale) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const ListTile(title: Text("Sale Complete", style: TextStyle(fontWeight: FontWeight.bold))),
          ListTile(
            leading: const Icon(Icons.print),
            title: const Text("Print Paper Receipt"),
            onTap: () {
              PrinterService().printReceipt(sale);
              Navigator.pop(ctx);
            },
          ),
          ListTile(
            leading: const Icon(Icons.message, color: Colors.green),
            title: const Text("Share on WhatsApp"),
            onTap: () {
              PrinterService().shareReceiptViaWhatsApp(sale, _selectedCustomer?.phone ?? '');
              Navigator.pop(ctx);
            },
          ),
        ],
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
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          children: [
            Expanded(child: Container(color: Colors.blue[50], child: const Icon(Icons.shopping_bag, size: 40))),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                children: [
                  Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text("OMR ${product.price.toStringAsFixed(3)}", style: const TextStyle(color: Colors.blue)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
