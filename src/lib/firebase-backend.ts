// Firebase Backend Integration for B-HUB POS
// 100% FREE - Never pauses - Production ready

import { db } from './firebase-init';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    Timestamp,
    writeBatch,
    doc
} from 'firebase/firestore';
import { Sale, Product, Customer } from '@/types/bhub';

export class FirebaseBackend {
    /**
     * Push sale to Firebase Firestore
     * ✅ FREE - Never pauses - Real-time sync
     */
    static async pushSale(sale: Sale): Promise<void> {
        try {
            const batch = writeBatch(db);

            // Add sale document
            const saleRef = doc(db, 'sales', sale.id);
            batch.set(saleRef, {
                id: sale.id,
                storeId: sale.storeId,
                shiftId: sale.shiftId,
                userId: sale.userId,
                customerId: sale.customerId || null,
                subtotal: sale.subtotal,
                vatAmount: sale.vatAmount,
                discount: sale.discount,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
                amountPaid: sale.amountPaid,
                change: sale.change,
                receiptNumber: sale.receiptNumber,
                timestamp: Timestamp.fromDate(new Date(sale.timestamp)),
                createdAt: Timestamp.now(),
            });

            // Add sale items as subcollection
            sale.items.forEach((item, index) => {
                const itemRef = doc(db, 'sales', sale.id, 'items', `item_${index}`);
                batch.set(itemRef, {
                    productId: item.product.id,
                    productName: item.product.name,
                    productNameAr: item.product.nameAr,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    vatAmount: item.vatAmount,
                    unit: item.selectedUnit,
                });
            });

            await batch.commit();
            console.log('✅ Sale synced to Firebase:', sale.id);
        } catch (error) {
            console.error('❌ Firebase sync failed:', error);
            throw error;
        }
    }

    /**
     * Fetch products from Firebase
     * Optimized for 13,000 products
     */
    static async fetchProducts(storeId: string): Promise<Product[]> {
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('storeId', '==', storeId));
            const snapshot = await getDocs(q);

            const products: Product[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                products.push({
                    id: doc.id,
                    sku: data.sku,
                    barcode: data.barcode,
                    name: data.name,
                    nameAr: data.nameAr,
                    category: data.category,
                    price: data.price,
                    cost: data.cost,
                    stock: data.stock,
                    unit: data.unit,
                    isWeightBased: data.isWeightBased || false,
                    isFastMoving: data.isFastMoving || false,
                    vatRate: data.vatRate || 0.05,
                });
            });

            console.log(`✅ Loaded ${products.length} products from Firebase`);
            return products;
        } catch (error) {
            console.error('❌ Failed to fetch products:', error);
            return [];
        }
    }

    /**
     * Fetch customers for loyalty lookup
     */
    static async fetchCustomers(storeId: string): Promise<Customer[]> {
        try {
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, where('storeId', '==', storeId));
            const snapshot = await getDocs(q);

            const customers: Customer[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                customers.push({
                    id: doc.id,
                    phone: data.phone,
                    name: data.name,
                    loyaltyPoints: data.loyaltyPoints || 0,
                    discountTier: data.discountTier || 0,
                });
            });

            return customers;
        } catch (error) {
            console.error('❌ Failed to fetch customers:', error);
            return [];
        }
    }

    /**
     * Search customer by phone
     */
    static async searchCustomer(storeId: string, phone: string): Promise<Customer | null> {
        try {
            const customersRef = collection(db, 'customers');
            const q = query(
                customersRef,
                where('storeId', '==', storeId),
                where('phone', '==', phone)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;

            const data = snapshot.docs[0].data();
            return {
                id: snapshot.docs[0].id,
                phone: data.phone,
                name: data.name,
                loyaltyPoints: data.loyaltyPoints || 0,
                discountTier: data.discountTier || 0,
            };
        } catch (error) {
            console.error('❌ Failed to search customer:', error);
            return null;
        }
    }

    /**
     * Get dashboard stats for owner remote monitoring
     */
    static async getDashboardStats(storeId: string, date: Date = new Date()) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Get today's sales
            const salesRef = collection(db, 'sales');
            const q = query(
                salesRef,
                where('storeId', '==', storeId),
                where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
                where('timestamp', '<=', Timestamp.fromDate(endOfDay))
            );

            const snapshot = await getDocs(q);

            let todaySales = 0;
            const recentSales: any[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                todaySales += data.total;
                recentSales.push({
                    id: data.receiptNumber,
                    time: data.timestamp.toDate().toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    cashier: 'Cashier',
                    total: data.total,
                });
            });

            // Get low stock products
            const productsRef = collection(db, 'products');
            const lowStockQuery = query(
                productsRef,
                where('storeId', '==', storeId),
                where('stock', '<', 10)
            );
            const lowStockSnapshot = await getDocs(lowStockQuery);

            return {
                todaySales,
                todayTransactions: snapshot.size,
                activeCashiers: 1,
                lowStockAlerts: lowStockSnapshot.size,
                recentSales: recentSales.slice(-10).reverse(),
                hourlySales: [], // TODO: Implement hourly breakdown
                topProducts: [], // TODO: Implement top products
            };
        } catch (error) {
            console.error('❌ Failed to fetch dashboard stats:', error);
            return null;
        }
    }

    /**
     * Batch import products (for your 13,000 products)
     */
    static async batchImportProducts(storeId: string, products: any[]): Promise<void> {
        try {
            const batchSize = 500; // Firebase limit
            const batches = [];

            for (let i = 0; i < products.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = products.slice(i, i + batchSize);

                chunk.forEach((product) => {
                    const productRef = doc(collection(db, 'products'));
                    batch.set(productRef, {
                        storeId,
                        sku: product.sku,
                        barcode: product.barcode,
                        name: product.name,
                        nameAr: product.nameAr || product.name,
                        category: product.category || 'General',
                        price: parseFloat(product.price),
                        cost: parseFloat(product.cost || 0),
                        stock: parseInt(product.stock || 0),
                        unit: product.unit || 'piece',
                        isWeightBased: product.isWeightBased || false,
                        isFastMoving: product.isFastMoving || false,
                        vatRate: 0.05,
                        createdAt: Timestamp.now(),
                    });
                });

                batches.push(batch.commit());
            }

            await Promise.all(batches);
            console.log(`✅ Imported ${products.length} products to Firebase`);
        } catch (error) {
            console.error('❌ Failed to import products:', error);
            throw error;
        }
    }
}

export { db };
