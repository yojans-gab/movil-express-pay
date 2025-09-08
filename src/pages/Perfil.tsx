import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, UserCheck, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Perfil = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      setFormData({
        nombre_completo: profile.nombre_completo || '',
        telefono: profile.telefono || '',
      });
    }
  }, [user, profile, navigate]);

  // Show loading state if user is not loaded or profile is still loading
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!profile) return;
    
    // Input validation and sanitization
    if (!formData.nombre_completo.trim()) {
      toast({
        title: "Error",
        description: "El nombre completo es requerido.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.nombre_completo.length > 100) {
      toast({
        title: "Error",
        description: "El nombre es demasiado largo (máximo 100 caracteres).",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.telefono && formData.telefono.length > 20) {
      toast({
        title: "Error",
        description: "El teléfono es demasiado largo (máximo 20 caracteres).",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // SECURITY: Only allow updating specific fields, never rol
      const updateData = {
        nombre_completo: formData.nombre_completo.trim(),
        telefono: formData.telefono?.trim() || null,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se guardaron correctamente",
      });
      
      setEditing(false);
      // Reload the page to refresh the profile data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'operador':
        return 'default';
      case 'cliente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{profile.nombre_completo}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Badge variant={getRoleBadgeVariant(profile.rol)}>
                {profile.rol === 'operador' ? 'Operador' : 'Cliente'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.correo_electronico}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  El correo electrónico no se puede modificar
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre Completo
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={editing ? formData.nombre_completo : profile.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  disabled={!editing}
                  className={!editing ? "bg-gray-50" : ""}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={editing ? formData.telefono : (profile.telefono || 'No especificado')}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={!editing}
                  className={!editing ? "bg-gray-50" : ""}
                  placeholder="Ingresa tu número de teléfono"
                />
              </div>

              {/* Account Info */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Información de la Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha de registro:</span>
                    <p className="font-medium">
                      {new Date(profile.created_at).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Última actualización:</span>
                    <p className="font-medium">
                      {new Date(profile.updated_at).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                {!editing ? (
                  <Button 
                    onClick={() => setEditing(true)} 
                    className="flex-1"
                  >
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          nombre_completo: profile.nombre_completo,
                          telefono: profile.telefono || '',
                        });
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;