-- Insert Banco Tikal comercio if it doesn't exist
INSERT INTO public.comercio (nombre, banco_comercio_id, cuenta_numero)
VALUES ('Banco Tikal', 2006, 'tikal-2006')
ON CONFLICT DO NOTHING;