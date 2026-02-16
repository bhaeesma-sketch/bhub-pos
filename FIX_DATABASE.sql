
-- B-HUB POS DATABASE FIX SCRIPT
-- Copy and paste this into your Supabase SQL Editor to fix missing tables.

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

-- 2. Create Transaction Items Table
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    vat_amount NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create Credit Ledger Table
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
    amount NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS and Create Policies
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Anyone can manage staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read transaction items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage transaction items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read credit ledger" ON public.credit_ledger FOR SELECT USING (true);
CREATE POLICY "Anyone can manage credit ledger" ON public.credit_ledger FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed Default Owner (Fallback)
INSERT INTO public.staff (name, pin, role) 
VALUES ('Owner', '1234', 'owner')
ON CONFLICT DO NOTHING;

-- 6. Verify Tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
