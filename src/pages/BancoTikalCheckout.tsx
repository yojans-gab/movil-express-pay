import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { clearCartFromStorage } from '@/lib/cart-security';

declare global {
  interface Window {
    BancoTikalWidget: {
      init: (config: {
        merchantId: number;
        amount: number;
        currency: string;
        onSuccess: (paymentData: any) => void;
        onError: (error: any) => void;
      }) => void;
    };
  }
}

const BancoTikalCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const ordenId = searchParams.get('orden_id');
  const pagoId = searchParams.get('pago_id');
  const amount = parseFloat(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!ordenId || !pagoId || !amount) {
      navigate('/carrito');
      return;
    }

    // Cargar el script del widget de Banco Tikal
    const script = document.createElement('script');
    script.src = 'https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js';
    script.async = true;
    
    script.onload = () => {
      setWidgetLoaded(true);
      initWidget();
    };

    script.onerror = () => {
      console.error('Error loading Banco Tikal widget');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [ordenId, amount, navigate]);

  const initWidget = () => {
    if (!window.BancoTikalWidget) {
      console.error('Banco Tikal Widget not available');
      return;
    }

    try {
      window.BancoTikalWidget.init({
        merchantId: 2006, // ID del comercio en Banco Tikal
        amount: amount,
        currency: 'GTQ',
        
        onSuccess: async (paymentData) => {
          console.log('✅ Pago exitoso:', paymentData);
          
          try {
            // Confirm payment in backend
            const { error } = await supabase.functions.invoke('confirm-banco-tikal-payment', {
              body: {
                pagoId: pagoId,
                bancoTransactionId: paymentData?.transactionId || paymentData?.id || null,
              },
            });

            if (error) {
              console.error('Error confirming payment:', error);
              throw error;
            }

            // Clear cart and navigate to success page
            clearCartFromStorage();
            
            if (paymentData.transactionId) {
              // Pago con tarjeta completado
              navigate(`/payment-success?orden_id=${ordenId}&transaction_id=${paymentData.transactionId}`);
            } else if (paymentData.codigoOrden) {
              // Orden de pago generada (pago en efectivo o transferencia)
              navigate(`/payment-success?orden_id=${ordenId}&codigo_orden=${paymentData.codigoOrden}&clave_acceso=${paymentData.claveAcceso}`);
            } else {
              navigate(`/payment-success?orden_id=${ordenId}`);
            }
          } catch (error) {
            console.error('Payment confirmation failed:', error);
            alert('El pago fue procesado pero hubo un error al confirmar. Por favor contacta a soporte.');
            navigate('/carrito');
          }
        },
        
        onError: (error) => {
          console.error('❌ Error en pago:', error);
          alert(`Error en el pago: ${error.message}\n\nIntenta nuevamente o contacta a soporte.`);
        }
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing widget:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/carrito')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Pago - Banco Tikal</h1>
          </div>

          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                🏦 Pasarela de Pagos Segura
              </CardTitle>
              <p className="text-purple-100 text-sm">
                Completa tu pago de forma segura con Banco Tikal
              </p>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-between items-center">
                <span className="text-lg font-semibold">Total a Pagar</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(amount)}
                </span>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Cargando pasarela de pago...</p>
                </div>
              )}

              <div 
                id="banco-tikal-widget" 
                className={loading ? 'hidden' : 'min-h-[400px]'}
              />

              <div className="mt-6 flex items-center justify-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
                <span className="text-sm font-medium">Pago Seguro Encriptado</span>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-4 text-sm text-gray-500">
            Powered by <strong>Banco Tikal</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BancoTikalCheckout;
