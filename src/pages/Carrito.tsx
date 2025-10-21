import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Package, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { saveCartToStorage, loadCartFromStorage, clearCartFromStorage } from '@/lib/cart-security';
import BankSelector from '@/components/BankSelector';

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  stock: number;
  descripcion?: string;
  foto_url?: string;
  codigo: string;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

const Carrito = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadCartFromLocalStorage();
  }, [user, loading, navigate]);

  const loadCartFromLocalStorage = () => {
    try {
      const items = loadCartFromStorage();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoadingCart(false);
    }
  };

  const saveCartToLocalStorage = (items: CartItem[]) => {
    saveCartToStorage(items);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.producto.id === productId
        ? { ...item, cantidad: Math.min(newQuantity, item.producto.stock) }
        : item
    );
    
    setCartItems(updatedItems);
    saveCartToLocalStorage(updatedItems);
  };

  const removeFromCart = (productId: string) => {
    const updatedItems = cartItems.filter(item => item.producto.id !== productId);
    setCartItems(updatedItems);
    saveCartToLocalStorage(updatedItems);
    toast({
      title: "Producto eliminado",
      description: "El producto fue removido del carrito",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    clearCartFromStorage();
    toast({
      title: "Carrito vaciado",
      description: "Se eliminaron todos los productos del carrito",
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.cantidad, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(price);
  };

  const handleCheckout = async (bankName: string) => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    try {
      setLoadingCart(true);
      
      const orderDetails = {
        telefono: profile.telefono || "No especificado",
        direccion_envio: "Dirección de envío (ejemplo)",
      };

      const totalAmount = getTotalPrice();

      // Si es Banco Tikal, navegar a su checkout
      if (bankName === 'Banco Tikal') {
        navigate('/banco-tikal-checkout', {
          state: {
            cartItems,
            orderDetails,
            totalAmount,
          },
        });
        return;
      }

      // Si es Banco Kabzin, navegar a su checkout con BATZIR
      if (bankName === 'Banco Kabzin') {
        navigate('/banco-kabzin-checkout', {
          state: {
            cartItems,
            orderDetails,
            totalAmount,
          },
        });
        return;
      }

      // Para otros bancos (Stripe, etc.)
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          cartItems,
          orderDetails,
          bankName,
        },
      });

      if (error) throw error;
      
      if (data?.paymentUrl) {
        toast({
          title: "Redirigiendo al banco...",
          description: `Serás redirigido a la pasarela de pago de ${bankName}.`
        });
        window.location.href = data.paymentUrl;
      } else {
         throw new Error("No se recibió una URL de pago.");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Error en el pago",
        description: error.message || "No se pudo iniciar el proceso de pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoadingCart(false);
    }
  };

  if (loading || loadingCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
          {cartItems.length > 0 && (
            <Button variant="outline" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Vaciar Carrito
            </Button>
          )}
        </div>
        {cartItems.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Tu carrito está vacío</CardTitle>
              <CardDescription>
                Agrega productos desde el catálogo para empezar tu compra
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/catalogo')}
                className="w-full"
              >
                Ir al Catálogo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.producto.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {item.producto.foto_url && (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.producto.foto_url} 
                            alt={item.producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg">{item.producto.nombre}</h3>
                        <p className="text-gray-600 text-sm">{item.producto.marca}</p>
                        <p className="text-blue-600 font-bold">{formatPrice(item.producto.precio)}</p>
                        <p className="text-xs text-gray-500">Stock disponible: {item.producto.stock}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                          disabled={item.cantidad >= item.producto.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.producto.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de productos:</span>
                    <span>{getTotalItems()}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <BankSelector
                      onBankSelect={handleCheckout}
                      className="w-full"
                      triggerText="Proceder al Pago"
                    />
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/catalogo')}
                  >
                    Seguir Comprando
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrito;