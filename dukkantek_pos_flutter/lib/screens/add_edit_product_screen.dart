import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/services/firestore_service.dart';
import 'package:uuid/uuid.dart';

class AddEditProductScreen extends ConsumerStatefulWidget {
  final Product? product;

  const AddEditProductScreen({super.key, this.product});

  @override
  ConsumerState<AddEditProductScreen> createState() => _AddEditProductScreenState();
}

class _AddEditProductScreenState extends ConsumerState<AddEditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _priceController = TextEditingController();
  final _costController = TextEditingController();
  final _stockController = TextEditingController();
  final _minStockController = TextEditingController();
  String _category = 'General';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      _nameController.text = widget.product!.name;
      _barcodeController.text = widget.product!.barcode;
      _priceController.text = widget.product!.price.toStringAsFixed(3);
      _costController.text = widget.product!.cost.toStringAsFixed(3);
      _stockController.text = widget.product!.stock.toString();
      _minStockController.text = widget.product!.minStock.toString();
      _category = widget.product!.category;
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      final inventoryService = ref.read(inventoryServiceProvider);
      final product = Product(
        id: widget.product?.id ?? const Uuid().v4(),
        name: _nameController.text.trim(),
        category: _category,
        price: double.tryParse(_priceController.text) ?? 0.0,
        cost: double.tryParse(_costController.text) ?? 0.0,
        barcode: _barcodeController.text.trim(),
        stock: int.tryParse(_stockController.text) ?? 0,
        minStock: int.tryParse(_minStockController.text) ?? 5,
        imageUrl: '',
      );
      if (widget.product == null) {
        await inventoryService.addProduct(product);
      } else {
        await inventoryService.updateProduct(product);
      }
      if (!mounted) return;
      Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(widget.product == null ? 'REGISTER NEW PRODUCT' : 'UPDATE PRODUCT SPECIFICATIONS', 
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildSectionCard('OFFICIAL IDENTITY', [
                _buildField('Product Name', _nameController, Icons.inventory_2_outlined),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: _buildField('SKU / Barcode', _barcodeController, Icons.qr_code_scanner)),
                    const SizedBox(width: 20),
                    Expanded(child: _buildCategoryDropdown()),
                  ],
                ),
              ]),
              const SizedBox(height: 30),
              _buildSectionCard('PRICING & REVENUE (OMR)', [
                Row(
                  children: [
                    Expanded(child: _buildField('Trading Cost', _costController, Icons.account_balance_outlined, isNumber: true)),
                    const SizedBox(width: 20),
                    Expanded(child: _buildField('Selling Price', _priceController, Icons.payments_outlined, isNumber: true)),
                  ],
                ),
              ]),
              const SizedBox(height: 30),
              _buildSectionCard('STOCK LOGISTICS', [
                Row(
                  children: [
                    Expanded(child: _buildField('Current Units', _stockController, Icons.warehouse_outlined, isNumber: true)),
                    const SizedBox(width: 20),
                    Expanded(child: _buildField('Low Stock Warning', _minStockController, Icons.notification_important_outlined, isNumber: true)),
                  ],
                ),
              ]),
              const SizedBox(height: 50),
              SizedBox(
                height: 60,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProduct,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 0,
                  ),
                  child: _isSaving 
                    ? const CircularProgressIndicator(color: Colors.white) 
                    : const Text('CONFIRM SPECIFICATIONS & SAVE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.slate.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFFD4AF37), letterSpacing: 2)),
          const SizedBox(height: 25),
          ...children,
        ],
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, IconData icon, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1)),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A)),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.slate.shade300, size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD4AF37))),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('REGISTRY CATEGORY', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.slate, letterSpacing: 1)),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          value: _category,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A)),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.slate.shade100)),
          ),
          items: ['General', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Meat', 'Fruits', 'Vegetables']
              .map((c) => DropdownMenuItem(value: c, child: Text(c.toUpperCase())))
              .toList(),
          onChanged: (v) => setState(() => _category = v!),
        ),
      ],
    );
  }
}
