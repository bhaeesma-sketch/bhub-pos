import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/firestore_service.dart';

// Import Add/Edit Form (Next step)
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
    // Get Service
    final inventoryService = ref.watch(inventoryServiceProvider);
    
    // Stream Products
    final productStream = inventoryService.getProducts();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Navigate to Add Product Screen
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditProductScreen()));
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search products by name or barcode...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() {}), // Local refresh for filter
            ),
          ),
          
          // Product List
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
                
                // Filter Logic
                final filtered = products.where((p) {
                  final q = _searchController.text.toLowerCase();
                  return p.name.toLowerCase().contains(q) || p.barcode.contains(q);
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('No products found. Add one!'));
                }

                // Grid View for Tablet / List for Mobile
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    final product = filtered[index];
                    return ProductListItem(
                      product: product,
                      onEdit: () {
                        // Navigate to Edit Screen
                        Navigator.push(context, MaterialPageRoute(builder: (_) => AddEditProductScreen(product: product)));
                      },
                      onDelete: () async {
                        await inventoryService.deleteProduct(product.id);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditProductScreen()));
        },
        child: const Icon(Icons.add),
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
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: Colors.primaries[product.name.length % Colors.primaries.length].withOpacity(0.2),
        radius: 24,
        child: Text(product.name[0], style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Barcode: ${product.barcode} | Cat: ${product.category}'),
          Text(
            'Stock: ${product.stock} ${product.stock <= product.minStock ? '(LOW STOCK)' : ''}',
            style: TextStyle(color: product.stock <= product.minStock ? Colors.red : Colors.grey),
          ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'OMR ${product.price.toStringAsFixed(3)}',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).primaryColor),
          ),
          const SizedBox(width: 16),
          IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: onEdit),
          IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: onDelete),
        ],
      ),
    );
  }
}
