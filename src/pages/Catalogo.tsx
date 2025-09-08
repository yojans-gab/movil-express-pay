import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { saveCartToStorage, loadCartFromStorage } from '@/lib/cart-security';

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

const Catalogo = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProductos();
  }, [user, loading, navigate]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre');

      if (error) {
        console.error('Error fetching productos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(price);
  };

  const addToCart = (producto: Producto) => {
    try {
      // Load existing cart items securely
      const cartItems = loadCartFromStorage();
      
      const existingItemIndex = cartItems.findIndex((item: any) => item.producto.id === producto.id);
      
      if (existingItemIndex >= 0) {
        // Si ya existe, incrementar cantidad (respetando stock)
        const newQuantity = Math.min(cartItems[existingItemIndex].cantidad + 1, producto.stock);
        cartItems[existingItemIndex].cantidad = newQuantity;
        
        if (newQuantity === producto.stock) {
          toast({
            title: "Producto agregado",
            description: `${producto.nombre} agregado (stock máximo alcanzado)`,
          });
        } else {
          toast({
            title: "Producto agregado",
            description: `${producto.nombre} se agregó al carrito`,
          });
        }
      } else {
        // Si no existe, agregar nuevo item
        cartItems.push({ producto, cantidad: 1 });
        toast({
          title: "Producto agregado",
          description: `${producto.nombre} se agregó al carrito`,
        });
      }
      
      // Save securely
      saveCartToStorage(cartItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingProductos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
          </div>
        </div>

        {/* Products Grid */}
        {productos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-600">Los productos aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <Card key={producto.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">{producto.nombre}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">{producto.marca}</CardDescription>
                    </div>
                    <Badge variant={producto.stock > 0 ? "default" : "destructive"}>
                      {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {producto.foto_url && (
                    <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <img 
                        src={producto.foto_url} 
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <p className="text-2xl font-bold text-blue-600">{formatPrice(producto.precio)}</p>
                    
                    {producto.descripcion && (
                      <p className="text-sm text-gray-600 line-clamp-2">{producto.descripcion}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Código: {producto.codigo}</span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={producto.stock === 0}
                      onClick={() => addToCart(producto)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {producto.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;