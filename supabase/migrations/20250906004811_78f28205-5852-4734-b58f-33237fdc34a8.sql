-- Create profiles table that integrates with Supabase Auth
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    correo_electronico TEXT NOT NULL,
    telefono TEXT,
    rol app_role NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Operadores can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Create trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre_completo, correo_electronico, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'rol')::app_role, 'cliente')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing RLS policies to use profiles table instead of usuarios
DROP POLICY IF EXISTS "Operadores can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;

-- Update clientes table to reference profiles instead of usuarios
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_usuario_id_fkey;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update ordenes table to reference profiles instead of usuarios  
ALTER TABLE public.ordenes DROP CONSTRAINT IF EXISTS ordenes_usuario_id_fkey;
ALTER TABLE public.ordenes ADD CONSTRAINT ordenes_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies to use profiles table
DROP POLICY IF EXISTS "Users can view their own client info" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert their own client info" ON public.clientes;
DROP POLICY IF EXISTS "Users can update their own client info" ON public.clientes;
DROP POLICY IF EXISTS "Operadores can view all clients" ON public.clientes;

CREATE POLICY "Users can view their own client info" ON public.clientes
    FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert their own client info" ON public.clientes
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own client info" ON public.clientes
    FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Operadores can view all clients" ON public.clientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.ordenes;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.ordenes;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.ordenes;
DROP POLICY IF EXISTS "Operadores can view all orders" ON public.ordenes;

CREATE POLICY "Users can view their own orders" ON public.ordenes
    FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON public.ordenes
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own orders" ON public.ordenes
    FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Operadores can view all orders" ON public.ordenes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update order items policies
DROP POLICY IF EXISTS "Users can view items from their orders" ON public.orden_items;
DROP POLICY IF EXISTS "Users can create items for their orders" ON public.orden_items;
DROP POLICY IF EXISTS "Operadores can manage all order items" ON public.orden_items;

CREATE POLICY "Users can view items from their orders" ON public.orden_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id = auth.uid()
        )
    );

CREATE POLICY "Users can create items for their orders" ON public.orden_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id = auth.uid()
        )
    );

CREATE POLICY "Operadores can manage all order items" ON public.orden_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update products policies  
DROP POLICY IF EXISTS "Operadores can manage all products" ON public.productos;

CREATE POLICY "Operadores can manage all products" ON public.productos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update payments policies
DROP POLICY IF EXISTS "Users can view payments for their orders" ON public.pagos;
DROP POLICY IF EXISTS "Operadores can view all payments" ON public.pagos;

CREATE POLICY "Users can view payments for their orders" ON public.pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id = auth.uid()
        )
    );

CREATE POLICY "Operadores can view all payments" ON public.pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update comercios policies
DROP POLICY IF EXISTS "Operadores can manage comercios" ON public.comercios;

CREATE POLICY "Operadores can manage comercios" ON public.comercios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'operador'
        )
    );

-- Update storage policies
DROP POLICY IF EXISTS "Operadores can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Operadores can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Operadores can delete product images" ON storage.objects;

CREATE POLICY "Operadores can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'operador'
    )
);

CREATE POLICY "Operadores can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'operador'
    )
);

CREATE POLICY "Operadores can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'operador'
    )
);

-- Add trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();