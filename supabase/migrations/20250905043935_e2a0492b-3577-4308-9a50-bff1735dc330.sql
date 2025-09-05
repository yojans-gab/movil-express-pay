-- Create enums
CREATE TYPE public.app_role AS ENUM ('cliente', 'operador');
CREATE TYPE public.estado_orden AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE public.estado_pago AS ENUM ('PENDING', 'APROBADO', 'RECHAZADO', 'REFUNDED');

-- Create usuarios table
CREATE TABLE public.usuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    correo_electronico TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    telefono TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    rol app_role NOT NULL DEFAULT 'cliente'
);

-- Create clientes table
CREATE TABLE public.clientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    dpi TEXT UNIQUE,
    direccion TEXT,
    telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create productos table
CREATE TABLE public.productos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    precio NUMERIC(15,2) NOT NULL CHECK (precio > 0),
    estado TEXT NOT NULL DEFAULT 'activo',
    foto_url TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comercios table
CREATE TABLE public.comercios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    banco_comercio_id INTEGER,
    cuenta_numero TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ordenes table
CREATE TABLE public.ordenes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    estado estado_orden NOT NULL DEFAULT 'PENDING',
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    direccion_envio TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orden_items table
CREATE TABLE public.orden_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(15,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pagos table
CREATE TABLE public.pagos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes(id),
    comercio_id UUID NOT NULL REFERENCES public.comercios(id),
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    estado estado_pago NOT NULL DEFAULT 'PENDING',
    referencia TEXT,
    banco_pago_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pagos_webhook_logs table
CREATE TABLE public.pagos_webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pago_id UUID REFERENCES public.pagos(id),
    payload JSONB NOT NULL,
    headers JSONB,
    recibido_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_usuarios_correo ON public.usuarios(correo_electronico);
CREATE INDEX idx_productos_codigo ON public.productos(codigo);
CREATE INDEX idx_pagos_idempotency_key ON public.pagos(idempotency_key);
CREATE INDEX idx_ordenes_usuario_id ON public.ordenes(usuario_id);
CREATE INDEX idx_orden_items_orden_id ON public.orden_items(orden_id);
CREATE INDEX idx_pagos_orden_id ON public.pagos(orden_id);
CREATE INDEX idx_pagos_webhook_logs_pago_id ON public.pagos_webhook_logs(pago_id);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view their own profile" ON public.usuarios
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Operadores can view all users" ON public.usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for clientes
CREATE POLICY "Users can view their own client info" ON public.clientes
    FOR SELECT USING (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Users can insert their own client info" ON public.clientes
    FOR INSERT WITH CHECK (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Users can update their own client info" ON public.clientes
    FOR UPDATE USING (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Operadores can view all clients" ON public.clientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for productos
CREATE POLICY "Public can view active products" ON public.productos
    FOR SELECT USING (estado = 'activo');

CREATE POLICY "Operadores can manage all products" ON public.productos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for ordenes
CREATE POLICY "Users can view their own orders" ON public.ordenes
    FOR SELECT USING (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Users can create their own orders" ON public.ordenes
    FOR INSERT WITH CHECK (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Users can update their own orders" ON public.ordenes
    FOR UPDATE USING (
        usuario_id::text = auth.uid()::text
    );

CREATE POLICY "Operadores can view all orders" ON public.ordenes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for orden_items
CREATE POLICY "Users can view items from their orders" ON public.orden_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create items for their orders" ON public.orden_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Operadores can manage all order items" ON public.orden_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for comercios
CREATE POLICY "Operadores can manage comercios" ON public.comercios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- RLS Policies for pagos
CREATE POLICY "Users can view payments for their orders" ON public.pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes 
            WHERE id = orden_id AND usuario_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Operadores can view all payments" ON public.pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'operador'
        )
    );

-- Allow service role to manage pagos (for Edge Functions)
CREATE POLICY "Service role can manage pagos" ON public.pagos
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for pagos_webhook_logs
CREATE POLICY "Only service role can access webhook logs" ON public.pagos_webhook_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comercios_updated_at
    BEFORE UPDATE ON public.comercios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at
    BEFORE UPDATE ON public.ordenes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orden_items_updated_at
    BEFORE UPDATE ON public.orden_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at
    BEFORE UPDATE ON public.pagos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.ordenes 
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM public.orden_items 
        WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
    )
    WHERE id = COALESCE(NEW.orden_id, OLD.orden_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update order total when items change
CREATE TRIGGER update_order_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.orden_items
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_total();

-- Function to confirm order and update stock
CREATE OR REPLACE FUNCTION public.confirmar_orden_y_restar_stock(p_pago_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_orden_id UUID;
    v_pago_estado estado_pago;
    v_orden_estado estado_orden;
    item_record RECORD;
    v_stock_actual INTEGER;
BEGIN
    -- Get payment and order info
    SELECT p.estado, p.orden_id, o.estado 
    INTO v_pago_estado, v_orden_id, v_orden_estado
    FROM public.pagos p
    JOIN public.ordenes o ON p.orden_id = o.id
    WHERE p.id = p_pago_id;
    
    -- Verify payment exists
    IF v_orden_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;
    
    -- Verify payment is approved
    IF v_pago_estado != 'APROBADO' THEN
        RAISE EXCEPTION 'Payment is not approved';
    END IF;
    
    -- Verify order is still pending
    IF v_orden_estado != 'PENDING' THEN
        RAISE EXCEPTION 'Order is not in pending state';
    END IF;
    
    -- Check stock for all items and update atomically
    FOR item_record IN 
        SELECT oi.producto_id, oi.cantidad, p.nombre, p.stock
        FROM public.orden_items oi
        JOIN public.productos p ON oi.producto_id = p.id
        WHERE oi.orden_id = v_orden_id
    LOOP
        -- Check if enough stock available
        IF item_record.stock < item_record.cantidad THEN
            RAISE EXCEPTION 'Insufficient stock for product %: available %, required %', 
                item_record.nombre, item_record.stock, item_record.cantidad;
        END IF;
        
        -- Update stock
        UPDATE public.productos 
        SET stock = stock - item_record.cantidad,
            updated_at = now()
        WHERE id = item_record.producto_id;
    END LOOP;
    
    -- Update order status
    UPDATE public.ordenes 
    SET estado = 'CONFIRMED',
        updated_at = now()
    WHERE id = v_orden_id;
    
    -- Update payment status if not already updated
    UPDATE public.pagos 
    SET estado = 'APROBADO',
        updated_at = now()
    WHERE id = p_pago_id AND estado != 'APROBADO';
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback will happen automatically
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to revert stock (for refunds)
CREATE OR REPLACE FUNCTION public.revertir_stock_orden(p_orden_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Revert stock for all items in the order
    FOR item_record IN 
        SELECT oi.producto_id, oi.cantidad
        FROM public.orden_items oi
        WHERE oi.orden_id = p_orden_id
    LOOP
        UPDATE public.productos 
        SET stock = stock + item_record.cantidad,
            updated_at = now()
        WHERE id = item_record.producto_id;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos', 'productos', true);

-- Storage policies for product images
CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'productos');

CREATE POLICY "Operadores can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id::text = auth.uid()::text AND rol = 'operador'
    )
);

CREATE POLICY "Operadores can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id::text = auth.uid()::text AND rol = 'operador'
    )
);

CREATE POLICY "Operadores can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'productos' AND 
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id::text = auth.uid()::text AND rol = 'operador'
    )
);

-- Insert seed data
-- Create a default comercio
INSERT INTO public.comercios (nombre, banco_comercio_id, cuenta_numero) 
VALUES ('Movil Express Principal', 1, 'COM-00001');

-- Insert sample products
INSERT INTO public.productos (nombre, marca, codigo, descripcion, stock, precio) VALUES
('iPhone 15 Pro', 'Apple', 'IPH15PRO128', 'iPhone 15 Pro 128GB con cámara profesional', 10, 8999.00),
('Samsung Galaxy S24', 'Samsung', 'SAMS24128', 'Samsung Galaxy S24 128GB con IA avanzada', 15, 7499.00),
('Xiaomi Redmi Note 13', 'Xiaomi', 'XRED13128', 'Xiaomi Redmi Note 13 128GB gran batería', 25, 2499.00),
('Google Pixel 8', 'Google', 'GPIX8128', 'Google Pixel 8 128GB con cámara computational', 8, 6999.00),
('OnePlus 12', 'OnePlus', 'OP12256', 'OnePlus 12 256GB carga ultrarrápida', 12, 7999.00),
('Motorola Edge 50', 'Motorola', 'MOTE50128', 'Motorola Edge 50 128GB pantalla curva', 20, 4999.00);