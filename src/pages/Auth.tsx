import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    rol: 'cliente' as 'cliente' | 'operador',
  });

  // Add email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginForm.email || !loginForm.password) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
        // Clear fields on incorrect credentials
        setLoginForm({ email: '', password: '' });
      } else if (error.message.includes('Email not confirmed')) {
        setError('Por favor confirma tu email antes de iniciar sesión.');
      } else {
        setError('Error al iniciar sesión: ' + error.message);
      }
    } else {
      // Clear fields after successful login
      setLoginForm({ email: '', password: '' });
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión exitosamente',
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!signupForm.email || !signupForm.password || !signupForm.nombre_completo) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    // Validate email format
    if (!emailRegex.test(signupForm.email)) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.nombre_completo, signupForm.rol);

    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (error.message.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else if (error.message.includes('Invalid email')) {
        setError('Por favor ingresa un email válido');
      } else {
        setError('Error al registrarse: ' + error.message);
      }
    } else {
      // Clear form fields after successful registration
      setSignupForm({
        email: '',
        password: '',
        confirmPassword: '',
        nombre_completo: '',
        rol: 'cliente',
      });
      
      toast({
        title: 'Registro exitoso',
        description: 'Revisa tu email para confirmar tu cuenta',
      });
      
      // Switch to login tab after successful signup
      setTimeout(() => {
        const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
        loginTab?.click();
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-foreground">Movil Express</h1>
          </div>
          <p className="text-muted-foreground">Tu tienda de móviles de confianza</p>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Acceso</CardTitle>
            <CardDescription className="text-center">
              Inicia sesión o crea una cuenta nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={signupForm.nombre_completo}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, nombre_completo: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupForm.password}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Contraseña</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-rol">Tipo de Usuario</Label>
                    <Select 
                      value={signupForm.rol} 
                      onValueChange={(value: 'cliente' | 'operador') => 
                        setSignupForm({ ...signupForm, rol: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="operador">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;