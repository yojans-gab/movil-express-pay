-- CRITICAL SECURITY FIX: Add RLS policies to usuarios table
-- This table currently has no protection and exposes sensitive data

-- Enable RLS on usuarios table
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Users can only view their own record
CREATE POLICY "Users can view their own usuario record" 
ON public.usuarios 
FOR SELECT 
USING (id = auth.uid());

-- Users can update their own record (excluding role and password)
CREATE POLICY "Users can update their own usuario record" 
ON public.usuarios 
FOR UPDATE 
USING (id = auth.uid());

-- Only allow operadores to view all usuario records
CREATE POLICY "Operadores can view all usuarios" 
ON public.usuarios 
FOR SELECT 
USING (is_operador(auth.uid()));

-- Only allow operadores to manage roles
CREATE POLICY "Only operadores can insert usuarios" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (is_operador(auth.uid()));

-- Prevent users from inserting or deleting usuarios records directly
CREATE POLICY "Block direct usuario deletion" 
ON public.usuarios 
FOR DELETE 
USING (false);

-- Add trigger to prevent role escalation in updates
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is trying to change their own role and they're not an operador, block it
    IF OLD.id = auth.uid() AND NEW.rol != OLD.rol AND NOT is_operador(auth.uid()) THEN
        RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
    
    -- Prevent users from changing password_hash directly
    IF OLD.id = auth.uid() AND NEW.password_hash != OLD.password_hash THEN
        RAISE EXCEPTION 'Password cannot be changed directly through this table';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();