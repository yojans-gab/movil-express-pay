import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const Carrito = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
        </div>

        {/* Content */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Carrito de Compras</CardTitle>
            <CardDescription>
              Aquí podrás ver y gestionar los productos que deseas comprar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-gray-600">
                El carrito de compras estará disponible próximamente.
              </p>
              <p className="text-sm text-gray-500">
                Podrás agregar productos desde el catálogo y realizar pedidos.
              </p>
              <div className="pt-6">
                <Button 
                  onClick={() => navigate('/catalogo')}
                  className="w-full"
                >
                  Ir al Catálogo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Carrito;