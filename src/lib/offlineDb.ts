import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import { Product, Sale, Customer } from '@/types/bhub';
import { cloudSync } from './bhub-cloud-sync';

interface BHubDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-barcode': string; 'by-name': string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-synced': number }; // 0 = not synced, 1 = synced
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-phone': string };
  };
  khat_ledger: {
    key: string;  // Customer Phone
    value: {
      phone: string;
      name: string;
      balance: number;
      lastTransaction: Date;
      history: {
        id: string;
        date: Date;
        amount: number; // Positive = Debt, Negative = Payment
        type: 'credit' | 'payment';
        ref: string; // Sale ID or Receipt No
      }[];
    };
  };
}

class OfflineDatabase {
  private dbPromise: Promise<IDBPDatabase<BHubDB>>;

  constructor() {
    this.dbPromise = openDB<BHubDB>('bhub-pos-db', 1, {
      upgrade(db) {
        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-barcode', 'barcode');
          productStore.createIndex('by-name', 'name');
        }

        // Sales Store (for offline queue)
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('by-synced', 'synced');
        }

        // Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-phone', 'phone');
        }

        // Khat Ledger Store
        if (!db.objectStoreNames.contains('khat_ledger')) {
          db.createObjectStore('khat_ledger', { keyPath: 'phone' });
        }
      },
    });
  }

  // --- Products ---
  async saveProducts(products: Product[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('products', 'readwrite');
    await Promise.all([
      ...products.map(p => tx.store.put(p)),
      tx.done
    ]);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const db = await this.dbPromise;
    return db.getFromIndex('products', 'by-barcode', barcode);
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await this.dbPromise;
    return db.getAll('products');
  }

  // --- Sales Queue ---
  async queueSale(sale: Sale) {
    const db = await this.dbPromise;
    await db.put('sales', { ...sale, synced: 0 }); // Mark as unsynced
  }

  async getPendingSales(): Promise<Sale[]> {
    const db = await this.dbPromise;
    // In a real implementation with valid index querying:
    // ranges/indexes would be used. For simplicity, filtering in memory:
    const allSales = await db.getAll('sales');
    return allSales.filter((s: any) => s.synced === 0);
  }

  async markSaleSynced(saleId: string) {
    const db = await this.dbPromise;
    const sale: any = await db.get('sales', saleId);
    if (sale) {
      sale.synced = 1;
      await db.put('sales', sale);
    }
  }

  // --- Khat Ledger ---
  async addCredit(customer: Customer, amount: number, ref: string) {
    const db = await this.dbPromise;
    const tx = db.transaction('khat_ledger', 'readwrite');
    const store = tx.store;

    let entry = await store.get(customer.phone);

    if (!entry) {
      entry = {
        phone: customer.phone,
        name: customer.name,
        balance: 0,
        lastTransaction: new Date(),
        history: []
      };
    }

    entry.balance += amount;
    entry.lastTransaction = new Date();
    entry.history.push({
      id: crypto.randomUUID(),
      date: new Date(),
      amount: amount,
      type: 'credit',
      ref: ref
    });

    await store.put(entry);
    await tx.done;
  }

  async saveKhat(khat: any) {
    const db = await this.dbPromise;
    await db.put('khat_ledger', khat);
  }

  async getKhat(phone: string) {
    const db = await this.dbPromise;
    return db.get('khat_ledger', phone);
  }

  async getAllKhats() {
    const db = await this.dbPromise;
    return db.getAll('khat_ledger');
  }
}

export const offlineDb = new OfflineDatabase();

// --- Compatibility Exports for POS.tsx ---
export const saveOfflineTransaction = async (transaction: any) => {
  // 1. Queue for general sales sync
  await offlineDb.queueSale(transaction);

  // 2. If it's a credit sale, update Khat ledger
  if (transaction.paymentMethod === 'Credit' || transaction.paymentMethod === 'Khat/Daftar') {
    const customer = {
      phone: transaction.customerPhone || transaction.customerId || 'Unknown',
      name: transaction.customer || 'Walk-in Customer'
    };
    await offlineDb.addCredit(customer as any, transaction.total, transaction.invoiceNo);
  }
};

export const getOfflineTransactionCount = async () => {
  const pending = await offlineDb.getPendingSales();
  return pending.length;
};
export const startBackgroundSync = (intervalMs: number = 20000) => {
  console.log('[CloudSync] Engine Initialized — Monitoring Legacy POS sales...');
  const id = setInterval(async () => {
    try {
      const pending = await offlineDb.getPendingSales();
      if (pending.length > 0) {
        console.log(`[CloudSync] Syncing ${pending.length} sales to Owner Dashboard...`);
        await cloudSync.syncPendingSales();
      }
    } catch (e) {
      console.error('[CloudSync] Connection paused:', e);
    }
  }, intervalMs);
  return () => clearInterval(id);
};
