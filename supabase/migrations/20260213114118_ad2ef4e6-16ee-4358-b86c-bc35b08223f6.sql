-- Allow all operations on staff table (this is a POS system without auth, using PIN-based access)
CREATE POLICY "Anyone can insert staff"
ON public.staff
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update staff"
ON public.staff
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete staff"
ON public.staff
FOR DELETE
USING (true);
