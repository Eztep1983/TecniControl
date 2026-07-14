'use client'
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/basic/input"
import { Save, Building, Loader2, Upload, Check, Camera, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Negocio } from '@/types/orden'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useNegocio } from '@/hooks/useNegocio'
import { motion, AnimatePresence } from 'motion/react'

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando tu negocio...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] overflow-hidden relative">

        <div className="p-8 sm:p-10 relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20">
              <Building className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Identidad del Negocio</h2>
              <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
                Personaliza la información que verán tus clientes en los reportes y facturas.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            {/* Sección de Logo */}
            <section className="flex flex-row items-center gap-6 p-6 rounded-3xl dark:bg-gray-800/40 bg-gray-50 border dark:border-white/5 border-gray-200/50">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('business-logo')?.click()}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border dark:border-gray-700 border-gray-300 bg-white dark:bg-gray-800 relative flex items-center justify-center transition-all group-hover:border-blue-500/50">
                  {negocio.logoUrl ? (
                    <img src={negocio.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                  
                  {/* Persistent Upload Icon Badge */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                    <Upload className="w-4 h-4 text-white" />
                  </div>

                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <span className="text-white text-[10px] font-semibold uppercase tracking-wider">Subir</span>
                    )}
                  </div>
                </div>
                <Input id="business-logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold dark:text-gray-200 text-gray-800">Logo de la empresa</h3>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Recomendamos usar una imagen cuadrada (1:1) en formato PNG con fondo transparente para un resultado profesional.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-gray-900 bg-gray-200 text-xs font-medium dark:text-gray-400 text-gray-600">
                  <Upload className="w-3.5 h-3.5" /> JPG, PNG o SVG hasta 2MB
                </div>
              </div>
            </section>

            <div className="w-full h-px dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

            {/* Formulario Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" />
                  Nombre Comercial <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={negocio.nombre || ''} 
                  onChange={(e) => handleInputChange('nombre', e.target.value)} 
                  placeholder="Ej. TecniFix Pro"
                  className="h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base shadow-sm transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  NIT / RUT
                </label>
                <Input 
                  value={negocio.nit || ''} 
                  onChange={(e) => handleInputChange('nit', e.target.value)} 
                  placeholder="Número de identificación tributaria"
                  className="h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base shadow-sm transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-500" />
                  Teléfono de Contacto
                </label>
                <Input 
                  value={negocio.telefono || ''} 
                  onChange={(e) => handleInputChange('telefono', e.target.value)} 
                  placeholder="+1 234 567 8900"
                  className="h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base shadow-sm transition-all" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500" />
                  Correo Electrónico Comercial
                </label>
                <Input 
                  type="email" 
                  value={negocio.email || ''} 
                  onChange={(e) => handleInputChange('email', e.target.value)} 
                  placeholder="contacto@tuempresa.com"
                  className="h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base shadow-sm transition-all" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  Dirección Física
                </label>
                <Input 
                  value={negocio.direccion || ''} 
                  onChange={(e) => handleInputChange('direccion', e.target.value)} 
                  placeholder="Av. Principal 123, Local 4, Ciudad"
                  className="h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base shadow-sm transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer sticky-like for Save Button */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-white/5 border-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <AnimatePresence>
              {saved && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium w-fit"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  Cambios guardados con éxito
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={guardarCambios} 
            disabled={saving || uploading}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
