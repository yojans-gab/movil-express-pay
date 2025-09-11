import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  stock: number;
  descripcion?: string;
  foto_url?: string;
  codigo: string;
  estado: string;
}

const AdminPanel = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    precio: '',
    stock: '',
    descripcion: '',
    foto_url: '',
    codigo: ''
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/');
      return;
    }
    if (!profile || profile.rol !== 'operador') {
      navigate('/dashboard');
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder al panel de administración",
        variant: "destructive",
      });
      return;
    }
    fetchProductos();
  }, [user, profile, loading, navigate]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
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

  const resetForm = () => {
    setFormData({
      nombre: '',
      marca: '',
      precio: '',
      stock: '',
      descripcion: '',
      foto_url: '',
      codigo: ''
    });
    setEditingProduct(null);
  };

  const openEditModal = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      marca: producto.marca,
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      descripcion: producto.descripcion || '',
      foto_url: producto.foto_url || '',
      codigo: producto.codigo
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      nombre: formData.nombre.trim(),
      marca: formData.marca.trim(),
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      descripcion: formData.descripcion.trim() || null,
      foto_url: formData.foto_url.trim() || null,
      codigo: formData.codigo.trim(),
      estado: 'activo'
    };

    try {
      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('productos')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se ha actualizado correctamente",
        });
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('productos')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto se ha creado correctamente",
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchProductos();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (producto: Producto) => {
    const newStatus = producto.estado === 'activo' ? 'inactivo' : 'activo';
    
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado: newStatus })
        .eq('id', producto.id);

      if (error) throw error;

      toast({
        title: newStatus === 'activo' ? "Producto activado" : "Producto desactivado",
        description: `El producto ${producto.nombre} ahora está ${newStatus}`,
      });

      fetchProductos();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del producto",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingProductos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel de administración...</p>
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateModal} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Modifica los detalles del producto' 
                    : 'Ingresa los detalles del nuevo producto'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="precio">Precio (GTQ)</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="foto_url">URL de la Foto</Label>
                  <Input
                    id="foto_url"
                    type="url"
                    value={formData.foto_url}
                    onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        {productos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos</h3>
            <p className="text-gray-600">Crea tu primer producto para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <Card key={producto.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">{producto.nombre}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">{producto.marca}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={producto.estado === 'activo' ? "default" : "destructive"}>
                        {producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant={producto.stock > 0 ? "secondary" : "destructive"}>
                        Stock: {producto.stock}
                      </Badge>
                    </div>
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
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditModal(producto)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant={producto.estado === 'activo' ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleProductStatus(producto)}
                        className="flex-1"
                      >
                        {producto.estado === 'activo' ? (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    </div>
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

export default AdminPanel;