
-- B-HUB POS DATABASE FIX SCRIPT (v2.0)
-- Copy and paste this into your Supabase SQL Editor.

-- 1. Create Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create Store Config Table
CREATE TABLE IF NOT EXISTS public.store_config (
    id SERIAL PRIMARY KEY,
    store_name TEXT NOT NULL DEFAULT 'B-HUB POS',
    vat_number TEXT,
    address TEXT,
    location TEXT,
    currency TEXT DEFAULT 'OMR',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed initial config if empty
INSERT INTO public.store_config (store_name) 
SELECT 'B-HUB POS' WHERE NOT EXISTS (SELECT 1 FROM public.store_config);

-- 3. Ensure Products table has Unique Barcode and consistent schema
-- This will fail if duplicate barcodes exist, so we use a safe approach
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_key') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
    END IF;
END $$;

-- 4. High-Performance Indexing for 13,000+ Products
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products USING btree (barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING btree (name);

-- 4. Create RPC for Khat (Debt) Integration
CREATE OR REPLACE FUNCTION public.increment_customer_debt(cust_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.customers
    SET total_debt = COALESCE(total_debt, 0) + amount
    WHERE id = cust_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create Bulk Sync Protocol
CREATE OR REPLACE FUNCTION public.bulk_sync_inventory(p_barcode TEXT, p_new_stock NUMERIC, p_new_price NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET 
        stock = p_new_stock,
        price = p_new_price,
        updated_at = now()
    WHERE barcode = p_barcode;
END;
$$ LANGUAGE plpgsql;

-- 6. Create Stock Audit Table (for tracking changes)
CREATE TABLE IF NOT EXISTS public.stock_audit (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    previous_stock NUMERIC,
    actual_stock NUMERIC,
    difference NUMERIC,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create Transaction Tables
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    staff_id UUID REFERENCES public.staff(id),
    customer_id UUID REFERENCES public.customers(id),
    subtotal NUMERIC NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 0,
    tax_total NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'Khat', 'Split')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    vat_amount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create Credit Ledger (Khat)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
    amount NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Enable RLS and Create Policies
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All Staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Store Config" ON public.store_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Transaction Items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Credit Ledger" ON public.credit_ledger FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed Default Owner
INSERT INTO public.staff (name, pin, role) 
VALUES ('Owner', '1234', 'owner')
ON CONFLICT DO NOTHING;

-- 8. Verify
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
