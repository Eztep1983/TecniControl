// app/configuracion/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card";
import { Input } from "@/components/ui/basic/input";
import { Button } from "@/components/ui/basic/button";
import { Label } from "@/components/ui/basic/label";
import { Switch } from "@/components/ui/basic/switch";
import { Save, User, Building, FileText, Loader2, Settings } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Negocio } from '@/types/orden';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


interface NegocioConUsuario extends Negocio {
  userId: string;
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [negocio, setNegocio] = useState<NegocioConUsuario>({
    id: '',
    userId: user?.uid || '',
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    nit: '',
    logoUrl: ''
  });

  // Cargar datos del negocio
  useEffect(() => {
    const cargarNegocio = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const negocioRef = doc(db, 'negocios', user.uid);
        const negocioDoc = await getDoc(negocioRef);
        
        if (negocioDoc.exists()) {
          setNegocio({ ...negocioDoc.data(), id: negocioDoc.id } as NegocioConUsuario);
        } else {
          // Crear negocio por defecto si no existe
          const negocioDefault: NegocioConUsuario = {
            id: user.uid,
            userId: user.uid,
            nombre: user.displayName || 'Mi Negocio',
            direccion: '',
            telefono: '',
            email: user.email || '',
            nit: '',
            logoUrl: ''
          };
          await setDoc(negocioRef, negocioDefault);
          setNegocio(negocioDefault);
        }
      } catch (error) {
        console.error('Error cargando negocio:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarNegocio();
  }, [user]);

  // Manejar subida de logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `negocios/${user.uid}/logo/${file.name}`);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Actualizar estado local
      setNegocio(prev => ({ ...prev, logoUrl: downloadURL }));
    } catch (error) {
      console.error('Error subiendo logo:', error);
    } finally {
      setUploading(false);
    }
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!user?.uid) return;
    
    try {
      setSaving(true);
      const negocioRef = doc(db, 'negocios', user.uid);
      await updateDoc(negocioRef, {
        ...negocio,
        updatedAt: new Date()
      });
      
      // Mostrar mensaje de éxito
      alert('Cambios guardados correctamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof Negocio, value: string) => {
    setNegocio(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white font-headline">Configuración</h1>
        </div>

        {/* Información del Negocio */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5" />
              Información del Negocio
            </CardTitle>
            <CardDescription className="text-gray-400">
              Actualiza los datos de tu negocio. Estos cambios se reflejarán en todo el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Logo del Negocio */}
            <div className="space-y-4">
              <Label className="text-gray-300">Logo del Negocio</Label>
              <div className="flex items-center gap-4">
                {negocio.logoUrl ? (
                  <img 
                    src={negocio.logoUrl} 
                    alt="Logo del negocio" 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    id="business-logo" 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    {uploading ? 'Subiendo imagen...' : 'Sube el logo de tu negocio (opcional). Formatos: JPG, PNG, SVG.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-name" className="text-gray-300">Nombre del Negocio</Label>
                <Input 
                  id="business-name" 
                  value={negocio.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-nit" className="text-gray-300">NIT</Label>
                <Input 
                  id="business-nit" 
                  value={negocio.nit}
                  onChange={(e) => handleInputChange('nit', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-phone" className="text-gray-300">Teléfono</Label>
                <Input 
                  id="business-phone" 
                  value={negocio.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email" className="text-gray-300">Email</Label>
                <Input 
                  id="business-email" 
                  type="email"
                  value={negocio.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-address" className="text-gray-300">Dirección</Label>
              <Input 
                id="business-address" 
                value={negocio.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={guardarCambios} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información del Usuario */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Usuario
            </CardTitle>
            <CardDescription className="text-gray-400">
              Tus datos de acceso al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre</Label>
                <Input 
                  value={user?.displayName || 'No especificado'} 
                  disabled 
                  className="bg-gray-700 border-gray-600 text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input 
                  value={user?.email || 'No especificado'} 
                  disabled 
                  className="bg-gray-700 border-gray-600 text-gray-400"
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              * Para cambiar tu información de usuario, actualiza tu perfil de Google.
            </p>
          </CardContent>
        </Card>

        {/* Preferencias del Sistema */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferencias del Sistema
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configura cómo funciona el sistema para tu negocio.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Notificaciones por email</Label>
                  <p className="text-sm text-gray-400">Recibir notificaciones importantes por correo</p>
                </div>
                <Switch className="data-[state=checked]:bg-blue-600" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Recordatorios automáticos</Label>
                  <p className="text-sm text-gray-400">Recordatorios de mantenimientos pendientes</p>
                </div>
                <Switch className="data-[state=checked]:bg-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Usuarios */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription className="text-gray-400">
              Administra los roles de los usuarios de tu equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                La gestión de usuarios y roles estará disponible próximamente.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Podrás invitar miembros de tu equipo y asignar permisos específicos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}