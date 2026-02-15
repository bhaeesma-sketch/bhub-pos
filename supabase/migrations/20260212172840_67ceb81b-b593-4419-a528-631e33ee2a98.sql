
-- ============================================
-- BHAEES POS FULL DATABASE SCHEMA
-- ============================================

-- Products table with bilingual support, bulk/unit, expiry
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  price NUMERIC(10,3) NOT NULL DEFAULT 0,
  cost NUMERIC(10,3) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'Piece',
  bulk_unit TEXT,
  bulk_qty INTEGER,
  supplier TEXT,
  sku TEXT,
  expiry_date DATE,
  image_url TEXT,
  is_weighted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table with credit/khat tracking
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_spent NUMERIC(10,3) NOT NULL DEFAULT 0,
  total_debt NUMERIC(10,3) NOT NULL DEFAULT 0,
  debt_health TEXT NOT NULL DEFAULT 'green',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions / Sales
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  subtotal NUMERIC(10,3) NOT NULL DEFAULT 0,
  discount NUMERIC(10,3) NOT NULL DEFAULT 0,
  vat NUMERIC(10,3) NOT NULL DEFAULT 0,
  total NUMERIC(10,3) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  cashier TEXT DEFAULT 'Admin',
  qr_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction line items
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,3) NOT NULL DEFAULT 0,
  cost NUMERIC(10,3) NOT NULL DEFAULT 0,
  discount NUMERIC(10,3) NOT NULL DEFAULT 0,
  total NUMERIC(10,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'OMR'
);

-- Customer credit / Khat ledger
CREATE TABLE public.credit_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id),
  amount NUMERIC(10,3) NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase orders
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  supplier TEXT,
  total_items INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC(10,3) NOT NULL DEFAULT 0,
  shipment_cost NUMERIC(10,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sale_price NUMERIC(10,3) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,3) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,3) NOT NULL DEFAULT 0,
  expiry_date DATE
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (POS system - authenticated users)
-- Products
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers
CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transactions
CREATE POLICY "Anyone can read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage transactions" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transaction Items
CREATE POLICY "Anyone can read transaction items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage transaction items" ON public.transaction_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credit Ledger
CREATE POLICY "Anyone can read credit ledger" ON public.credit_ledger FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage credit ledger" ON public.credit_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Anyone can read purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Order Items
CREATE POLICY "Anyone can read purchase order items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage purchase order items" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for transactions (live heartbeat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update customer debt health
CREATE OR REPLACE FUNCTION public.update_debt_health()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers SET
    debt_health = CASE
      WHEN total_debt <= 5 THEN 'green'
      WHEN total_debt <= 50 THEN 'yellow'
      ELSE 'red'
    END
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customer_debt_health AFTER INSERT ON public.credit_ledger FOR EACH ROW EXECUTE FUNCTION public.update_debt_health();
