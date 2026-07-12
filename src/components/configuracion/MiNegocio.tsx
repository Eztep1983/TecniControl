'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Input } from "@/components/ui/basic/input"
import { Button } from "@/components/ui/basic/button"
import { Label } from "@/components/ui/basic/label"
import { Save, Building, Loader2, Upload, Check, Camera } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Negocio } from '@/types/orden'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useNegocio } from '@/hooks/useNegocio'

interface NegocioConUsuario extends Negocio {
  userId: string;
}

export default function MiNegocio() {
  const { user } = useAuth();
  const { negocio: hookNegocio, loading: hookLoading } = useNegocio();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (hookLoading || !user?.uid) return;
    let isSubscribed = true;

    const inicializarNegocio = async () => {
      if (hookNegocio) {
        if (isSubscribed) {
          setNegocio({
            id: hookNegocio.id,
            userId: user.uid,
            nombre: hookNegocio.nombre || '',
            direccion: hookNegocio.direccion || '',
            telefono: hookNegocio.telefono || '',
            email: hookNegocio.email || '',
            nit: hookNegocio.nit || '',
            logoUrl: hookNegocio.logoUrl || ''
          });
          setLoading(false);
        }
        return;
      }

      try {
        const negocioRef = doc(db, 'negocios', user.uid);
        const negocioDoc = await getDoc(negocioRef);
        
        if (!isSubscribed) return;

        if (negocioDoc.exists()) {
          const data = negocioDoc.data();
          setNegocio({
            id: negocioDoc.id,
            userId: user.uid,
            nombre: data.nombre || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            email: data.email || '',
            nit: data.nit || '',
            logoUrl: data.logoUrl || ''
          });
        } else {
          setNegocio({
            id: user.uid,
            userId: user.uid,
            nombre: user.displayName || 'Mi Negocio',
            direccion: '',
            telefono: '',
            email: user.email || '',
            nit: '',
            logoUrl: ''
          });
        }
      } catch (err) {
        if (isSubscribed) setError('Error al cargar negocio');
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    inicializarNegocio();
    return () => { isSubscribed = false; };
  }, [hookNegocio, hookLoading, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setUploading(true);
      const storage = getStorage();
      const storageRef = ref(storage, `negocios/${user.uid}/logo/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setNegocio(prev => ({ ...prev, logoUrl: downloadURL }));
    } catch (err) {
      setError('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const guardarCambios = async () => {
    if (!user?.uid) return;
    try {
      setSaving(true);
      setSaved(false);
      const negocioRef = doc(db, 'negocios', user.uid);
      await setDoc(negocioRef, { ...negocio, updatedAt: new Date() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Negocio, value: string) => {
    setNegocio(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <Card className="dark:bg-gray-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.8)] transition-all hover:border-sky-500/30">
      <CardHeader className="border-b dark:border-white/10 border-gray-300/50 dark:bg-gray-950/80 bg-gray-50 rounded-t-2xl">
        <CardTitle className="dark:text-white text-gray-900 flex items-center gap-2 text-xl">
          <Building className="w-5 h-5 text-blue-400" />
          Información del Negocio
        </CardTitle>
        <CardDescription className="dark:text-gray-400 text-gray-600 mt-1">
          Datos principales que aparecerán en tus ordenes generadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</div>}
        
        <div className="space-y-3">
          <Label className="dark:text-gray-300 text-gray-700 font-medium flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Logo del Negocio
          </Label>
          <div className="flex items-start gap-6">
            <div className="relative group">
              {negocio.logoUrl ? (
                <img src={negocio.logoUrl} alt="Logo" className="w-24 h-24 rounded-xl object-cover border-2 dark:border-gray-600 border-gray-300" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-dashed dark:border-gray-600 border-gray-300 flex items-center justify-center">
                  <Building className="w-10 h-10 dark:text-gray-400 text-gray-600" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="business-logo" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 dark:bg-gray-900/80 bg-gray-100 hover:dark:bg-gray-900 hover:bg-gray-100 border dark:border-white/10 border-gray-300/50 rounded-2xl text-sm dark:text-gray-200 text-gray-800 hover:dark:text-white hover:text-gray-900">
                <Upload className="w-4 h-4" />
                {uploading ? 'Subiendo...' : 'Subir Logo'}
              </label>
              <Input id="business-logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-gray-700">Nombre del Negocio *</Label>
            <Input value={negocio.nombre || ''} onChange={(e) => handleInputChange('nombre', e.target.value)} className="dark:bg-gray-900/90 bg-gray-50 dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500" />
          </div>
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-gray-700">NIT / RUT</Label>
            <Input value={negocio.nit || ''} onChange={(e) => handleInputChange('nit', e.target.value)} className="dark:bg-gray-900/90 bg-gray-50 dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-gray-700">Teléfono</Label>
            <Input value={negocio.telefono || ''} onChange={(e) => handleInputChange('telefono', e.target.value)} className="dark:bg-gray-900/90 bg-gray-50 dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500" />
          </div>
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-gray-700">Email</Label>
            <Input type="email" value={negocio.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="dark:bg-gray-900/90 bg-gray-50 dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="dark:text-gray-300 text-gray-700">Dirección</Label>
          <Input value={negocio.direccion || ''} onChange={(e) => handleInputChange('direccion', e.target.value)} className="dark:bg-gray-900/90 bg-gray-50 dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700/50 border-gray-300">
          {saved && <span className="text-green-400 text-sm flex items-center gap-1"><Check className="w-4 h-4"/> Guardado</span>}
          <div className="w-full flex justify-end">
            <Button onClick={guardarCambios} disabled={saving} className="bg-sky-500 hover:bg-sky-600 dark:text-white text-gray-900">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
