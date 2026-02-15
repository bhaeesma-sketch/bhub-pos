
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Fix same issue on other tables
DROP POLICY IF EXISTS "Anyone can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;
CREATE POLICY "Anyone can read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can manage transaction items" ON public.transaction_items;
CREATE POLICY "Anyone can read transaction items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage transaction items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Anyone can manage customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read credit ledger" ON public.credit_ledger;
DROP POLICY IF EXISTS "Authenticated users can manage credit ledger" ON public.credit_ledger;
CREATE POLICY "Anyone can read credit ledger" ON public.credit_ledger FOR SELECT USING (true);
CREATE POLICY "Anyone can manage credit ledger" ON public.credit_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Anyone can read purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can manage purchase orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can manage purchase order items" ON public.purchase_order_items;
CREATE POLICY "Anyone can read purchase order items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage purchase order items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
