import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, ShoppingCart, User, LogOut, Phone, Mail } from 'lucide-react';

const Index = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Debug logs
  console.log('Index - user:', user);
  console.log('Index - profile:', profile);
  console.log('Index - loading:', loading);


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary" />
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Movil Express</h1>
                <p className="text-sm text-muted-foreground">Tu tienda de móviles de confianza</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Always show logout button if user exists */}
              {user && (
                <div className="flex items-center space-x-3">
                  {profile && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{profile.nombre_completo}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={profile.rol === 'operador' ? 'default' : 'secondary'}>
                          {profile.rol === 'operador' ? 'Operador' : 'Cliente'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {!profile && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Cargando perfil...</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            ¡Bienvenido a Movil Express!
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre los últimos smartphones con la mejor tecnología y precios competitivos. 
            Tu nuevo móvil te está esperando.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Products Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/catalogo')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Catálogo</span>
              </CardTitle>
              <CardDescription>
                Explora nuestra amplia selección de smartphones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/catalogo'); }}>
                Ver Productos
              </Button>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/carrito')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Mi Carrito</span>
              </CardTitle>
              <CardDescription>
                Revisa los productos que has seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/carrito'); }}>
                Ver Carrito
              </Button>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/perfil')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Mi Perfil</span>
              </CardTitle>
              <CardDescription>
                Gestiona tu información personal y pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/perfil'); }}>
                Ver Perfil
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Info Card */}
        {profile && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
              <CardDescription>
                Detalles de tu perfil en Movil Express
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{profile.nombre_completo}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.correo_electronico}</p>
                  </div>
                </div>

                {profile.telefono && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{profile.telefono}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Badge variant={profile.rol === 'operador' ? 'default' : 'secondary'}>
                    {profile.rol === 'operador' ? 'Operador' : 'Cliente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Movil Express. Todos los derechos reservados.</p>
            <p className="text-sm mt-2">Tu tienda de confianza para smartphones</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
