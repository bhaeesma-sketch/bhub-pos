import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dukkantek_pos_flutter/models/customer.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final customerServiceProvider = Provider((ref) => CustomerService());

class CustomerService {
  final _db = FirebaseFirestore.instance;

  Stream<List<Customer>> getCustomers() {
    return _db.collection('customers').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Customer.fromMap(doc.data(), doc.id)).toList();
    });
  }

  Future<void> addCustomer(Customer customer) async {
    await _db.collection('customers').doc(customer.id).set(customer.toMap());
  }

  Future<void> updateCustomer(Customer customer) async {
    await _db.collection('customers').doc(customer.id).update(customer.toMap());
  }

  Future<void> deleteCustomer(String id) async {
    await _db.collection('customers').doc(id).delete();
  }
}
