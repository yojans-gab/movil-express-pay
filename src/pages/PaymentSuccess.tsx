import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { clearCartFromStorage } from '@/lib/cart-security';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const ordenId = searchParams.get('orden_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart after successful payment
    clearCartFromStorage();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Procesando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu orden ha sido procesada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            {ordenId && (
              <p className="mb-4">
                Número de orden: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{ordenId}</code>
              </p>
            )}
            <p>
              Tu carrito ha sido vaciado y el stock se ha actualizado automáticamente.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">¿Qué sigue?</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Tu orden está siendo procesada</li>
              <li>• El stock de los productos se actualizó</li>
              <li>• Puedes seguir comprando</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Button 
              className="w-full"
              onClick={() => navigate('/perfil')}
            >
              Ver mis pedidos
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate('/catalogo')}
            >
              Seguir comprando
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;