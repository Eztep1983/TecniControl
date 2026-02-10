// app/configuracion/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card";
import { Input } from "@/components/ui/basic/input";
import { Button } from "@/components/ui/basic/button";
import { Label } from "@/components/ui/basic/label";
import { Switch } from "@/components/ui/basic/switch";
import { Save, Building, Loader2, Settings, Upload, Check, Mail, Bell, Camera } from 'lucide-react';
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
  const [saved, setSaved] = useState(false);
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
      setSaved(false);
      const negocioRef = doc(db, 'negocios', user.uid);
      await updateDoc(negocioRef, {
        ...negocio,
        updatedAt: new Date()
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <Settings className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-400 font-medium">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-headline">Configuración</h1>
              <p className="text-gray-400 text-sm mt-1">Administra la información de tu negocio</p>
            </div>
          </div>
        </div>

        {/* Información del Negocio */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6 transition-colors hover:border-gray-600/50">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Building className="w-5 h-5 text-blue-400" />
                  Información del Negocio
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  Datos principales que aparecerán en tus documentos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Logo del Negocio */}
            <div className="space-y-3">
              <Label className="text-gray-300 font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Logo del Negocio
              </Label>
              <div className="flex items-start gap-6">
                <div className="relative group">
                  {negocio.logoUrl ? (
                    <div className="relative">
                      <img 
                        src={negocio.logoUrl} 
                        alt="Logo del negocio" 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-600 transition-colors group-hover:border-blue-500/50 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center transition-colors group-hover:border-blue-500/50">
                      <Building className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label 
                    htmlFor="business-logo" 
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Subiendo...' : negocio.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                  </label>
                  <Input 
                    id="business-logo" 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400">
                    Formatos: JPG, PNG, SVG. Tamaño recomendado: 400x400px
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="business-name" className="text-gray-300 font-medium">
                  Nombre del Negocio <span className="text-red-400">*</span>
                </Label>
                <Input 
                  id="business-name" 
                  value={negocio.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Ej: TecniControl S.A.S"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-nit" className="text-gray-300 font-medium">
                  NIT / RUT
                </Label>
                <Input 
                  id="business-nit" 
                  value={negocio.nit}
                  onChange={(e) => handleInputChange('nit', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="123456789-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="business-phone" className="text-gray-300 font-medium">
                  Teléfono
                </Label>
                <Input 
                  id="business-phone" 
                  value={negocio.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email" className="text-gray-300 font-medium">
                  Email
                </Label>
                <Input 
                  id="business-email" 
                  type="email"
                  value={negocio.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-address" className="text-gray-300 font-medium">
                Dirección
              </Label>
              <Input 
                id="business-address" 
                value={negocio.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Calle 123 #45-67, Ciudad"
              />
            </div>

            {/* Botón de guardar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              {saved && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Cambios guardados correctamente</span>
                </div>
              )}
              <div className={saved ? "" : "w-full flex justify-end"}>
                <Button 
                  onClick={guardarCambios} 
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 px-6 transition-all hover:shadow-blue-500/30"
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
            </div>
          </CardContent>
        </Card>

        {/* Preferencias del Sistema */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6 transition-colors hover:border-gray-600/50">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-transparent">
            <CardTitle className="text-white flex items-center gap-2 text-xl">
              <Bell className="w-5 h-5 text-purple-400" />
              Preferencias del Sistema
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Personaliza las notificaciones y recordatorios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700/20 border border-gray-700/50 transition-colors hover:border-gray-600/50">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <Label className="text-gray-200 font-medium cursor-pointer">Notificaciones por email</Label>
                  </div>
                  <p className="text-sm text-gray-400">Recibe alertas importantes en tu correo electrónico</p>
                </div>
                <Switch className="data-[state=checked]:bg-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700/20 border border-gray-700/50 transition-colors hover:border-gray-600/50">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <Label className="text-gray-200 font-medium cursor-pointer">Recordatorios automáticos</Label>
                  </div>
                  <p className="text-sm text-gray-400">Alertas de mantenimientos y servicios pendientes</p>
                </div>
                <Switch className="data-[state=checked]:bg-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer informativo */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Los cambios se guardan en la base de datos en tiempo real</p>
        </div>
      </div>
    </div>
  );
}