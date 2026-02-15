
-- Create staff table for PIN-based authentication
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Allow public read for PIN login (staff doesn't use auth.users)
CREATE POLICY "Anyone can read staff for PIN login"
ON public.staff FOR SELECT
USING (true);

-- Only allow inserts/updates/deletes via service role (no client mutations for security)
-- Staff management will be done by owner through the app

-- Seed default owner
INSERT INTO public.staff (name, pin, role) VALUES ('Owner', '1234', 'owner');
INSERT INTO public.staff (name, pin, role) VALUES ('Cashier 1', '0000', 'staff');

-- Create trigger for updated_at
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
