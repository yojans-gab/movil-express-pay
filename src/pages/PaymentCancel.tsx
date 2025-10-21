import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ordenId = searchParams.get('orden');

  useEffect(() => {
    console.log('Payment cancelled for order:', ordenId);
  }, [ordenId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Pago Cancelado</CardTitle>
          <CardDescription>
            Tu pago ha sido cancelado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ordenId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Número de Orden</p>
              <p className="font-mono font-semibold">{ordenId}</p>
            </div>
          )}
          
          <p className="text-center text-muted-foreground">
            No se realizó ningún cargo a tu cuenta. Puedes intentar nuevamente cuando lo desees.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={() => navigate('/carrito')}
              className="w-full"
            >
              Volver al Carrito
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/catalogo')}
              className="w-full"
            >
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
