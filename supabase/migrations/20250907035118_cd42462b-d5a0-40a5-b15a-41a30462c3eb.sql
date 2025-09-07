-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Operadores can view all profiles" ON public.profiles;

-- Create a new policy that doesn't cause recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.is_operador(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND rol = 'operador'::app_role
  );
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Operadores can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_operador(auth.uid()));