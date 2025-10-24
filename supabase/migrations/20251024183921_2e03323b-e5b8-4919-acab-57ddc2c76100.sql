-- Enable RLS on stock_adjustment table
ALTER TABLE public.stock_adjustment ENABLE ROW LEVEL SECURITY;

-- Only service role and operadores can view stock adjustments
CREATE POLICY "Service role can manage stock_adjustment"
ON public.stock_adjustment
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Operadores can view stock_adjustment"
ON public.stock_adjustment
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profile
  WHERE profile.id = auth.uid() AND profile.rol = 'operador'::app_role
));