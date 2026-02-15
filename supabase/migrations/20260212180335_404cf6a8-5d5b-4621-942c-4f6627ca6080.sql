
-- Staff alert log for tracking restricted actions
CREATE TABLE public.staff_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_alerts ENABLE ROW LEVEL SECURITY;

-- Public read so owner dashboard can see alerts
CREATE POLICY "Anyone can read staff alerts"
ON public.staff_alerts FOR SELECT USING (true);

-- Allow inserts from anon (staff PIN login doesn't use auth)
CREATE POLICY "Anyone can create staff alerts"
ON public.staff_alerts FOR INSERT WITH CHECK (true);

-- Allow updates (mark as read)
CREATE POLICY "Anyone can update staff alerts"
ON public.staff_alerts FOR UPDATE USING (true);
