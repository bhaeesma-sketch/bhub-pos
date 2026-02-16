// Supabase Backend Integration for B-HUB POS
import { createClient } from '@supabase/supabase-js';
import { Sale, Product, Customer } from '@/types/bhub';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseBackend {
    /**
     * Push sale to Supabase
     */
    static async pushSale(sale: Sale): Promise<void> {
        try {
            // Insert sale record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert({
                    id: sale.id,
                    store_id: sale.storeId,
                    shift_id: sale.shiftId,
                    user_id: sale.userId,
                    customer_id: sale.customerId,
                    subtotal: sale.subtotal,
                    vat_amount: sale.vatAmount,
                    discount: sale.discount,
                    total: sale.total,
                    payment_method: sale.paymentMethod,
                    amount_paid: sale.amountPaid,
                    change: sale.change,
                    receipt_number: sale.receiptNumber,
                    timestamp: sale.timestamp,
                });

            if (saleError) throw saleError;

            // Insert sale items
            const saleItems = sale.items.map(item => ({
                sale_id: sale.id,
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                line_total: item.lineTotal,
                vat_amount: item.vatAmount,
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) throw itemsError;

            console.log('✅ Sale synced to Supabase:', sale.id);
        } catch (error) {
            console.error('❌ Supabase sync failed:', error);
            throw error;
        }
    }

    /**
     * Fetch products from Supabase
     */
    static async fetchProducts(storeId: string): Promise<Product[]> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId);

            if (error) throw error;

            return data.map(p => ({
                id: p.id,
                sku: p.sku,
                barcode: p.barcode,
                name: p.name,
                nameAr: p.name_ar,
                category: p.category,
                price: parseFloat(p.price),
                cost: parseFloat(p.cost),
                stock: p.stock,
                unit: p.unit,
                isWeightBased: p.is_weight_based,
                isFastMoving: p.is_fast_moving,
                vatRate: parseFloat(p.vat_rate),
            }));
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
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('store_id', storeId);

            if (error) throw error;

            return data.map(c => ({
                id: c.id,
                phone: c.phone,
                name: c.name,
                loyaltyPoints: c.loyalty_points,
                discountTier: c.discount_tier,
            }));
        } catch (error) {
            console.error('❌ Failed to fetch customers:', error);
            return [];
        }
    }

    /**
     * Get dashboard stats for owner
     */
    static async getDashboardStats(storeId: string, date: Date = new Date()) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Get today's sales
            const { data: sales, error } = await supabase
                .from('sales')
                .select('*')
                .eq('store_id', storeId)
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());

            if (error) throw error;

            const todaySales = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
            const todayTransactions = sales.length;

            // Get low stock products
            const { data: lowStock } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .lt('stock', 10);

            return {
                todaySales,
                todayTransactions,
                activeCashiers: 1, // TODO: Track active sessions
                lowStockAlerts: lowStock?.length || 0,
                recentSales: sales.slice(-10).reverse().map(s => ({
                    id: s.receipt_number,
                    time: new Date(s.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    cashier: 'Cashier',
                    total: parseFloat(s.total),
                })),
            };
        } catch (error) {
            console.error('❌ Failed to fetch dashboard stats:', error);
            return null;
        }
    }

    /**
     * Bulk upsert products
     */
    static async upsertProducts(products: Product[]): Promise<void> {
        try {
            const upsertData = products.map(p => ({
                id: p.id,
                store_id: p.storeId,
                sku: p.sku || p.barcode,
                barcode: p.barcode,
                name: p.name,
                name_ar: p.nameAr || p.name,
                category: p.category,
                price: p.price,
                cost: p.cost,
                stock: p.stock,
                unit: p.unit,
                is_weight_based: p.isWeightBased,
                is_fast_moving: p.isFastMoving,
                vat_rate: p.vatRate,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('products')
                .upsert(upsertData, { onConflict: 'barcode' });

            if (error) throw error;
            console.log(`✅ ${products.length} products upserted to Supabase`);
        } catch (error) {
            console.error('❌ Supabase upsert failed:', error);
            throw error;
        }
    }
}
