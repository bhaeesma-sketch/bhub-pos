import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/firestore_service.dart';
import 'add_edit_product_screen.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  final _searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final inventoryService = ref.watch(inventoryServiceProvider);
    final productStream = inventoryService.getProducts();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 100
      appBar: AppBar(
        title: const Text('Inventory Registry', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.white,
        centerTitle: false,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 15),
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditProductScreen())),
              icon: const Icon(Icons.add, size: 18),
              label: const Text("ADD PRODUCT", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Styled Search Bar
          Container(
            padding: const EdgeInsets.all(20),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by Name, SKU or Barcode...',
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
              onChanged: (value) => setState(() {}),
            ),
          ),
          
          Expanded(
            child: StreamBuilder<List<Product>>(
              stream: productStream,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                
                final products = snapshot.data ?? [];
                final filtered = products.where((p) {
                  final q = _searchController.text.toLowerCase();
                  return p.name.toLowerCase().contains(q) || p.barcode.contains(q);
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('No matching products found.', style: TextStyle(color: Colors.slate, fontWeight: FontWeight.bold)));
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(15),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) => ProductListItem(
                    product: filtered[index],
                    onEdit: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AddEditProductScreen(product: filtered[index]))),
                    onDelete: () => inventoryService.deleteProduct(filtered[index].id),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class ProductListItem extends StatelessWidget {
  final Product product;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ProductListItem({super.key, required this.product, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    bool isLow = product.stock <= product.minStock;
    return Container(
      margin: const EdgeInsets.bottom(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: isLow ? Colors.red.shade100 : Colors.slate.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.inventory_2_outlined, color: Colors.slate),
        ),
        title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('SKU: ${product.barcode} | ${product.category}', style: TextStyle(color: Colors.slate.shade400, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isLow ? Colors.red.shade50 : Colors.green.shade50,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    'Stock: ${product.stock.toInt()} IN',
                    style: TextStyle(color: isLow ? Colors.red : Colors.green, fontSize: 10, fontWeight: FontWeight.w900),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('OMR ${product.price.toStringAsFixed(3)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
            const SizedBox(height: 5),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(icon: Icon(Icons.edit_outlined, color: Colors.blue.shade300, size: 20), onPressed: onEdit, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                const SizedBox(width: 15),
                IconButton(icon: Icon(Icons.delete_outline, color: Colors.red.shade300, size: 20), onPressed: onDelete, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
