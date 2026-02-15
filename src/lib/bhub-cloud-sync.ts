import { Sale, Product, Customer } from '@/types/bhub';
import { FirebaseBackend } from './firebase-backend';

class BHubCloudSync {
    private static instance: BHubCloudSync;
    private syncQueue: Sale[] = [];
    private isSyncing = false;

    private constructor() {
        // Queue processing logic if needed, but Firebase has offline support built-in mostly.
        // However, explicit queueing for custom logic:
        setInterval(() => this.processSyncQueue(), 30000);
    }

    static getInstance(): BHubCloudSync {
        if (!BHubCloudSync.instance) {
            BHubCloudSync.instance = new BHubCloudSync();
        }
        return BHubCloudSync.instance;
    }

    async pushSale(sale: Sale): Promise<void> {
        return FirebaseBackend.pushSale(sale);
    }

    async fetchProducts(storeId: string): Promise<Product[]> {
        return FirebaseBackend.fetchProducts(storeId);
    }

    async fetchCustomers(storeId: string): Promise<Customer[]> {
        return FirebaseBackend.fetchCustomers(storeId);
    }

    async getDashboardStats(storeId: string, date: Date = new Date()): Promise<any> {
        return FirebaseBackend.getDashboardStats(storeId, date);
    }

    private async processSyncQueue(): Promise<void> {
        // Logic to process local queue if pushes failed (optional effectively handled by Firebase SDK but good for backup)
    }
}

export const cloudSync = BHubCloudSync.getInstance();
