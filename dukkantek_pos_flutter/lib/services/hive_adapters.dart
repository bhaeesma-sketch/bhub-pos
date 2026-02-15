import 'package:hive/hive.dart';
import 'package:dukkantek_pos_flutter/models/product.dart';
import 'package:dukkantek_pos_flutter/models/sale.dart';

// -----------------------------------------------------------------------------
// Manual Adapters for Hive (No Build Runner Required)
// -----------------------------------------------------------------------------

class ProductAdapter extends TypeAdapter<Product> {
  @override
  final int typeId = 0;

  @override
  Product read(BinaryReader reader) {
    return Product(
      id: reader.readString(),
      name: reader.readString(),
      category: reader.readString(),
      price: reader.readDouble(),
      cost: reader.readDouble(),
      barcode: reader.readString(),
      imageUrl: reader.readString(),
      stock: reader.readInt(),
      minStock: reader.readInt(),
      expiryDate: reader.readInt() != 0 ? DateTime.fromMillisecondsSinceEpoch(reader.readInt()) : null,
      lastRestockDate: reader.readInt() != 0 ? DateTime.fromMillisecondsSinceEpoch(reader.readInt()) : null,
    );
  }

  @override
  void write(BinaryWriter writer, Product obj) {
    writer.writeString(obj.id);
    writer.writeString(obj.name);
    writer.writeString(obj.category);
    writer.writeDouble(obj.price);
    writer.writeDouble(obj.cost);
    writer.writeString(obj.barcode);
    writer.writeString(obj.imageUrl);
    writer.writeInt(obj.stock);
    writer.writeInt(obj.minStock);
    
    writer.writeInt(obj.expiryDate != null ? 1 : 0);
    if (obj.expiryDate != null) writer.writeInt(obj.expiryDate!.millisecondsSinceEpoch);
    
    writer.writeInt(obj.lastRestockDate != null ? 1 : 0);
    if (obj.lastRestockDate != null) writer.writeInt(obj.lastRestockDate!.millisecondsSinceEpoch);
  }
}

class SaleItemAdapter extends TypeAdapter<SaleItem> {
  @override
  final int typeId = 1;

  @override
  SaleItem read(BinaryReader reader) {
    return SaleItem(
      productId: reader.readString(),
      productName: reader.readString(),
      category: reader.readString(),
      price: reader.readDouble(),
      cost: reader.readDouble(),
      quantity: reader.readDouble(),
    );
  }

  @override
  void write(BinaryWriter writer, SaleItem obj) {
    writer.writeString(obj.productId);
    writer.writeString(obj.productName);
    writer.writeString(obj.category);
    writer.writeDouble(obj.price);
    writer.writeDouble(obj.cost);
    writer.writeDouble(obj.quantity);
  }
}

class SaleAdapter extends TypeAdapter<Sale> {
  @override
  final int typeId = 2;

  @override
  Sale read(BinaryReader reader) {
    return Sale(
      id: reader.readString(),
      date: DateTime.fromMillisecondsSinceEpoch(reader.readInt()),
      items: (reader.readList()).cast<SaleItem>(),
      subtotal: reader.readDouble(),
      vat: reader.readDouble(),
      total: reader.readDouble(),
      paymentMethod: reader.readString(),
      staffId: reader.readString(),
      customerId: reader.readInt() != 0 ? reader.readString() : null,
      isCredit: reader.readBool(),
    );
  }

  @override
  void write(BinaryWriter writer, Sale obj) {
    writer.writeString(obj.id);
    writer.writeInt(obj.date.millisecondsSinceEpoch);
    writer.writeList(obj.items);
    writer.writeDouble(obj.subtotal);
    writer.writeDouble(obj.vat);
    writer.writeDouble(obj.total);
    writer.writeString(obj.paymentMethod);
    writer.writeString(obj.staffId);
    
    writer.writeInt(obj.customerId != null ? 1 : 0);
    if (obj.customerId != null) writer.writeString(obj.customerId!);
    
    writer.writeBool(obj.isCredit);
  }
}
