import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const BancoKabzinCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createOrderAndRedirect = async () => {
      try {
        const { cartItems, orderDetails, totalAmount } = location.state || {};
        
        if (!cartItems || !orderDetails) {
          throw new Error('Datos de orden no disponibles');
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Usuario no autenticado');
        }

        console.log('Creating Banco Kabzin order...');

        // Call edge function to create order and get BATZIR checkout URL
        const { data, error } = await supabase.functions.invoke('create-banco-kabzin-order', {
          body: {
            cartItems,
            orderDetails,
            totalAmount,
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Error al procesar el pago');
        }

        if (!data?.checkoutUrl) {
          throw new Error('No se recibió URL de checkout');
        }

        console.log('Redirecting to BATZIR checkout:', data.checkoutUrl);
        
        // Redirect to BATZIR checkout
        window.location.assign(data.checkoutUrl);
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'Error al procesar el pago');
        
        // Redirect back to cart after error
        setTimeout(() => {
          navigate('/carrito');
        }, 3000);
      }
    };

    createOrderAndRedirect();
  }, [location.state, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive text-xl font-semibold">
            Error al procesar el pago
          </div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Redirigiendo al carrito...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-semibold">Procesando pago...</h2>
        <p className="text-muted-foreground">
          Conectando con Banco Kabzin (BATZIR)
        </p>
      </div>
    </div>
  );
};

export default BancoKabzinCheckout;
