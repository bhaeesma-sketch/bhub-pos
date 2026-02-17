import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// ========== PRODUCTS ==========
// Fetches ALL products by paginating in chunks (Supabase defaults to 1000 rows)
import { offlineDb } from '@/lib/offlineDb';

// ========== PRODUCTS ==========
// Fetches ALL products from Supabase
async function fetchAllProducts() {
  const PAGE_SIZE = 1000;
  let allProducts: Tables<'products'>[] = [];
  let from = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        allProducts = allProducts.concat(data);
        hasMore = data.length === PAGE_SIZE;
        from += PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }
    return allProducts;
  } catch (error) {
    console.error('Fetch products failed:', error);
    throw error;
  }
}

export function useProducts() {
  const queryClient = useQueryClient();

  // 1. Background Sync (Network -> IDB)
  useQuery({
    queryKey: ['products', 'sync'],
    queryFn: async () => {
      console.log('🔄 Syncing products from cloud...');
      const data = await fetchAllProducts();
      await offlineDb.saveProducts(data);
      console.log(`✅ Synced ${data.length} products to local DB`);
      // Invalidating local query triggers UI update
      queryClient.invalidateQueries({ queryKey: ['products', 'local'] });
      return data;
    },
    staleTime: 5 * 60 * 1000, // Sync every 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // 2. UI Read (IDB -> UI) - Instant
  return useQuery({
    queryKey: ['products', 'local'],
    queryFn: async () => {
      const dbProducts = await offlineDb.getAllProducts();
      if (dbProducts.length === 0) {
        // Fallback for very first load if sync hasn't finished
        // We return empty and let the sync populate it
        return [];
      }
      return dbProducts;
    },
    staleTime: Infinity // Rely on sync to invalidate
  });
}

// ========== CUSTOMERS ==========
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// ========== TRANSACTIONS ==========
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ========== CREATE TRANSACTION ==========
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transaction,
      items,
    }: {
      transaction: TablesInsert<'transactions'>;
      items: TablesInsert<'transaction_items'>[];
    }) => {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      if (txError) throw txError;

      const itemsWithTxId = items.map((item) => ({
        ...item,
        transaction_id: txData.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsWithTxId);
      if (itemsError) throw itemsError;

      return txData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ========== UPDATE PRODUCT STOCK ==========
export function useUpdateProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stockDelta }: { id: string; stockDelta: number }) => {
      // Get current stock first
      const { data: product, error: fetchErr } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from('products')
        .update({ stock: product.stock + stockDelta })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ========== CATEGORIES (derived) ==========
export function useCategories() {
  const { data: products } = useProducts();
  const cats = new Set<string>();
  cats.add('All Items');
  products?.forEach((p) => cats.add(p.category));
  return Array.from(cats);
}

// ========== STAFF ==========
export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// ========== STAFF ALERTS ==========
export function useStaffAlerts() {
  return useQuery({
    queryKey: ['staff_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // poll every 10s for live updates
  });
}

// ========== STORE CONFIG ==========
export function useStoreConfig() {
  return useQuery({
    queryKey: ['store_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .single();
      if (error) throw error;

      // Cache in localStorage as well for offline fallback
      if (data) {
        localStorage.setItem('bhub_store_name', data.store_name);
        localStorage.setItem('bhub_vat_number', data.vat_number || '');
      }
      return data;
    },
  });
}
