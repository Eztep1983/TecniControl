'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from "@/components/ui/basic/input"
import { Save, Building, Loader2, Upload, Check, Phone, Mail, MapPin, FileText, Eraser, Undo, PenTool, Trash2, AlertCircle } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Negocio } from '@/types/orden'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useNegocio } from '@/hooks/useNegocio'
import { motion, AnimatePresence } from 'motion/react'
import SignatureCanvas from 'react-signature-canvas'
import { obfuscateSignature, deobfuscateSignature } from '@/lib/signature-utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog"
interface NegocioConUsuario extends Negocio {
  userId: string;
}

// Reusable Client-side Image Compression Helper
const compressImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  fillWhite: boolean
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (fillWhite) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
        }
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al comprimir la imagen.'));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(file);
  });
};

export default function MiNegocio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { negocio: hookNegocio, loading: hookLoading } = useNegocio();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form Field States
  const [negocio, setNegocio] = useState<NegocioConUsuario>({
    id: '',
    userId: user?.uid || '',
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    nit: '',
    logoUrl: '',
    firmaUrl: ''
  });

  // Staging Blob states for Logo & Signature (Two-Step Save Flow)
  const [logoBlob, setLogoBlob] = useState<Blob | null>(null);
  const [firmaBlob, setFirmaBlob] = useState<Blob | null>(null);
  const [firmaDeleted, setFirmaDeleted] = useState(false);
  
  // Staging loading indicators
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [isConfirmingDeleteSig, setIsConfirmingDeleteSig] = useState(false);

  // Tab views and refs
  const [signatureTab, setSignatureTab] = useState<'draw' | 'upload'>('draw');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);
  
  // Drawing states
  const [sigEmpty, setSigEmpty] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [transitionDone, setTransitionDone] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Delay canvas mounting until transition finishes to avoid ResizeObserver flickers
  useEffect(() => {
    const timer = setTimeout(() => setTransitionDone(true), 450);
    return () => clearTimeout(timer);
  }, []);

  // Previews referencing the local blob URLs or saved Firestore values
  const logoPreview = logoBlob ? URL.createObjectURL(logoBlob) : negocio.logoUrl;
  const firmaPreview = firmaBlob ? URL.createObjectURL(firmaBlob) : (firmaDeleted ? '' : negocio.firmaUrl);

  // Clean up Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (firmaPreview?.startsWith('blob:')) URL.revokeObjectURL(firmaPreview);
    };
  }, [logoPreview, firmaPreview]);

  // Synchronize state from hookNegocio (Single Source of Truth)
  useEffect(() => {
    if (hookLoading || !user?.uid) return;

    if (hookNegocio) {
      setNegocio({
        id: hookNegocio.id,
        userId: user.uid,
        nombre: hookNegocio.nombre || '',
        direccion: hookNegocio.direccion || '',
        telefono: hookNegocio.telefono || '',
        email: hookNegocio.email || '',
        nit: hookNegocio.nit || '',
        logoUrl: hookNegocio.logoUrl || '',
        firmaUrl: hookNegocio.firmaUrl || ''
      });
    } else {
      // Default initial states when document does not exist yet
      setNegocio({
        id: user.uid,
        userId: user.uid,
        nombre: user.displayName || 'Mi Negocio',
        direccion: '',
        telefono: '',
        email: user.email || '',
        nit: '',
        logoUrl: '',
        firmaUrl: ''
      });
    }
    setLoading(false);
  }, [hookNegocio, hookLoading, user]);

  // Unsaved changes detector
  useEffect(() => {
    if (!hookNegocio && !user?.uid) return;

    const baseNegocio = hookNegocio || {
      nombre: user?.displayName || 'Mi Negocio',
      direccion: '',
      telefono: '',
      email: user?.email || '',
      nit: '',
      logoUrl: '',
      firmaUrl: ''
    };

    const isNombreChanged = (negocio.nombre || '') !== (baseNegocio.nombre || '');
    const isDireccionChanged = (negocio.direccion || '') !== (baseNegocio.direccion || '');
    const isTelefonoChanged = (negocio.telefono || '') !== (baseNegocio.telefono || '');
    const isEmailChanged = (negocio.email || '') !== (baseNegocio.email || '');
    const isNitChanged = (negocio.nit || '') !== (baseNegocio.nit || '');
    const isLogoChanged = !!logoBlob;
    const isFirmaChanged = !!firmaBlob || firmaDeleted;

    setHasChanges(
      isNombreChanged ||
      isDireccionChanged ||
      isTelefonoChanged ||
      isEmailChanged ||
      isNitChanged ||
      isLogoChanged ||
      isFirmaChanged
    );
  }, [negocio, hookNegocio, logoBlob, firmaBlob, firmaDeleted, user]);

  // Canvas resize logic that preserves drawing states
  const resizeSigCanvas = useCallback(() => {
    const canvas = sigCanvas.current?.getCanvas();
    const container = sigContainerRef.current;
    if (!canvas || !container) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const currentData = sigCanvas.current?.toData() || [];

    canvas.width = container.offsetWidth * ratio;
    canvas.height = container.offsetHeight * ratio;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    }

    sigCanvas.current?.clear();
    setSigEmpty(true);
    
    if (currentData.length > 0) {
      sigCanvas.current?.fromData(currentData);
      setSigEmpty(false);
    } else if (firmaPreview) {
      try {
        const clearFirma = deobfuscateSignature(firmaPreview);
        if (clearFirma && !clearFirma.startsWith('blob:')) {
          sigCanvas.current?.fromDataURL(clearFirma);
          setSigEmpty(false);
        }
      } catch (e) {
        console.error('Error al restaurar la firma:', e);
      }
    }
  }, [firmaPreview]);

  useEffect(() => {
    if (!transitionDone || signatureTab !== 'draw' || !sigContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      resizeSigCanvas();
    });

    observer.observe(sigContainerRef.current);
    resizeSigCanvas();

    return () => {
      observer.disconnect();
    };
  }, [signatureTab, resizeSigCanvas, transitionDone]);

  // Reactive canvas draw update (No second registration step needed)
  const updateSignatureFromCanvas = () => {
    const canvas = sigCanvas.current?.getCanvas();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          setFirmaBlob(blob);
          setFirmaDeleted(false);
          setError('');
        }
      }, 'image/webp', 0.3);
    }
  };

  const handleCanvasDrawEnd = () => {
    if (sigCanvas.current) {
      const strokeData = sigCanvas.current.toData();
      setHistory(prev => [...prev, strokeData]);
      setSigEmpty(false);
      updateSignatureFromCanvas();
    }
  };

  const handleUndoSignature = () => {
    if (sigCanvas.current && history.length > 0) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      sigCanvas.current.clear();
      
      if (newHistory.length > 0) {
        sigCanvas.current.fromData(newHistory[newHistory.length - 1]);
        updateSignatureFromCanvas();
      } else {
        setSigEmpty(true);
        setFirmaBlob(null);
        setFirmaDeleted(true);
      }
    }
  };

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setHistory([]);
    setSigEmpty(true);
    setFirmaBlob(null);
    setFirmaDeleted(true);
  };

  // Client-side Logo uploader with resizing and compression (< 2MB rule is now enforced and compressed)
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      
      if (!file.type.startsWith('image/')) {
        setError('El logo de la empresa debe ser un archivo de imagen.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('El archivo supera el tamaño máximo permitido de 2MB.');
        return;
      }

      // Compress and resize client-side to a max width/height of 400px (standard logo dimension)
      const compressedLogo = await compressImage(file, 400, 400, 0.8, false);
      setLogoBlob(compressedLogo);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la imagen del logo.');
    } finally {
      e.target.value = '';
    }
  };

  // Client-side Signature file selector
  const handleSignatureFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen (JPG, PNG o WEBP).');
        return;
      }

      // Compress and resize signature to 280x120px WebP, filled with white background
      const compressedSig = await compressImage(file, 280, 120, 0.35, true);
      setFirmaBlob(compressedSig);
      setFirmaDeleted(false);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo de firma.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveSignatureClick = () => {
    setIsConfirmingDeleteSig(true);
  };

  const confirmRemoveSignature = () => {
    setFirmaBlob(null);
    setFirmaDeleted(true);
    setIsConfirmingDeleteSig(false);
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHistory([]);
      setSigEmpty(true);
    }
  };

  const cancelRemoveSignature = () => {
    setIsConfirmingDeleteSig(false);
  };

  // Submit and Save everything to Firestore and Storage
  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // 1. Validaciones de Formulario
    const nombreTrimmed = negocio.nombre?.trim() || '';
    if (!nombreTrimmed) {
      setError('El Nombre Comercial es obligatorio.');
      return;
    }

    if (negocio.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(negocio.email)) {
      setError('El formato del correo electrónico comercial no es válido.');
      return;
    }

    if (negocio.telefono) {
      const phoneDigits = negocio.telefono.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        setError('El teléfono de contacto debe tener al menos 7 dígitos.');
        return;
      }
    }

    try {
      setSaving(true);
      setError('');
      setSaved(false);

      let finalLogoUrl = negocio.logoUrl || '';
      let finalFirmaUrl = negocio.firmaUrl || '';

      const storage = getStorage();

      // 2. Upload Logo to a constant path: negocios/{uid}/logo/logo.webp (Overwrites old logs, preventing orphans)
      if (logoBlob) {
        setUploadingLogo(true);
        const logoRef = ref(storage, `negocios/${user.uid}/logo/logo.webp`);
        const snapshot = await uploadBytes(logoRef, logoBlob, { contentType: 'image/webp' });
        finalLogoUrl = await getDownloadURL(snapshot.ref);
        setUploadingLogo(false);
      }

      // 3. Upload Signature to constant path: negocios/{uid}/signature/firma.webp (Clean Storage integration)
      if (firmaBlob) {
        setUploadingSignature(true);
        const signatureRef = ref(storage, `negocios/${user.uid}/signature/firma.webp`);
        const snapshot = await uploadBytes(signatureRef, firmaBlob, { contentType: 'image/webp' });
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Obfuscate Storage URL before saving to Firestore
        finalFirmaUrl = obfuscateSignature(downloadURL) || '';
        setUploadingSignature(false);
      } else if (firmaDeleted) {
        finalFirmaUrl = '';
      }

      // 4. Update Firestore Document
      const negocioRef = doc(db, 'negocios', user.uid);
      const payload = {
        ...negocio,
        nombre: nombreTrimmed,
        logoUrl: finalLogoUrl,
        firmaUrl: finalFirmaUrl,
        updatedAt: new Date()
      };

      await setDoc(negocioRef, payload, { merge: true });

      // Clean staging blobs and preview states on success
      setLogoBlob(null);
      setFirmaBlob(null);
      setFirmaDeleted(false);
      setNegocio(payload as NegocioConUsuario);

      // Invalidate tanstack query cache to reload logo/signature globally
      await queryClient.invalidateQueries({ queryKey: ['negocio', user.uid] });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error guardando la configuración de negocio.');
    } finally {
      setSaving(false);
      setUploadingLogo(false);
      setUploadingSignature(false);
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
      <form onSubmit={guardarCambios} className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] overflow-hidden relative">

        <div className="p-8 sm:p-10 relative z-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20">
              <Building className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Identidad del Negocio</h2>
              <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
                Personaliza la información que verán tus clientes en las ordenes de servicio.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {/* Warning Banner for Unsaved Changes */}
            {hasChanges && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-semibold flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>Tienes cambios sin guardar en tu configuración.</span>
                  </div>
                  <span className="text-[10px] uppercase bg-amber-500/20 px-2 py-0.5 rounded-lg font-extrabold tracking-wider">
                    Pendiente
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            {/* Logo Section */}
            <section className="flex flex-row items-center gap-6 p-6 rounded-3xl dark:bg-gray-800/40 bg-gray-50 border dark:border-white/5 border-gray-200/50">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('business-logo')?.click()}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border dark:border-gray-700 border-gray-300 bg-white dark:bg-gray-800 relative flex items-center justify-center transition-all group-hover:border-blue-500/50">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                  
                  {/* Persistent Upload Icon Badge */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                    <Upload className="w-4 h-4 text-white" />
                  </div>

                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity ${uploadingLogo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploadingLogo ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <span className="text-white text-[10px] font-semibold uppercase tracking-wider">Subir</span>
                    )}
                  </div>
                </div>
                <Input id="business-logo" type="file" accept="image/*" onChange={handleLogoSelect} disabled={uploadingLogo} className="hidden" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold dark:text-gray-200 text-gray-800">Logo de la empresa</h3>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Recomendamos usar una imagen cuadrada (1:1) en formato PNG, JPG o WEBP. Redimensionada automáticamente a 400px.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg dark:bg-gray-900 bg-gray-200 text-xs font-medium dark:text-gray-400 text-gray-600">
                  <Upload className="w-3.5 h-3.5" /> JPG, PNG o WEBP hasta 2MB
                </div>
              </div>
            </section>

            <div className="w-full h-px dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

            {/* Principal Form */}
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
                  required
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
                  type="tel"
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

            <div className="w-full h-px dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

            {/* Signature Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold dark:text-gray-200 text-gray-800 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-500" />
                  Firma del Técnico Responsable
                </h3>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1 max-w-xl leading-relaxed">
                  Esta firma aparecerá en el pie de página de los reportes PDF de órdenes de servicio en la casilla del técnico responsable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Signature Register Panel (Left) */}
                <div className="space-y-4 dark:bg-gray-800/40 bg-gray-50 border dark:border-white/5 border-gray-200/50 rounded-3xl p-5">
                  
                  {/* Selector tabs */}
                  <div className="flex border-b dark:border-gray-800 border-gray-200 mb-4">
                    <button
                      type="button"
                      onClick={() => setSignatureTab('draw')}
                      className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                        signatureTab === 'draw'
                          ? 'border-blue-500 text-blue-500'
                          : 'border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      Dibujar Firma
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureTab('upload')}
                      className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                        signatureTab === 'upload'
                          ? 'border-blue-500 text-blue-500'
                          : 'border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-250'
                      }`}
                    >
                      Subir Imagen
                    </button>
                  </div>

                  {signatureTab === 'draw' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed dark:border-gray-700 border-gray-300 rounded-2xl bg-white dark:bg-gray-950/20 text-center cursor-pointer hover:border-blue-500/50 transition-colors relative"
                           onClick={() => setIsSignatureModalOpen(true)}>
                        
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border dark:border-blue-500/20 border-blue-100 mb-3 text-blue-500">
                          <PenTool className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold dark:text-gray-200 text-gray-800">Abrir lienzo de firma</span>
                        <span className="text-xs text-gray-400 mt-1 leading-normal">Toca aquí para dibujar tu firma a pantalla completa</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed dark:border-gray-700 border-gray-300 rounded-2xl bg-white dark:bg-gray-950/20 text-center cursor-pointer hover:border-blue-500/50 transition-colors relative"
                           onClick={() => document.getElementById('signature-file-upload')?.click()}>
                        
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border dark:border-blue-500/20 border-blue-100 mb-3 text-blue-500">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold dark:text-gray-200 text-gray-800">Selecciona o arrastra una imagen</span>
                        <span className="text-[10px] text-gray-400 mt-1 leading-normal">JPG, PNG o WEBP. Será comprimida y optimizada.</span>

                        <input
                          id="signature-file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureFileSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Staging Preview Panel (Right) */}
                <div className="space-y-4">
                  <span className="text-sm font-bold dark:text-gray-300 text-gray-700 block">Vista Previa de la Firma</span>
                  
                  <div className="w-full h-[196px] rounded-3xl dark:bg-gray-800/40 bg-gray-50 border dark:border-white/5 border-gray-200/50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {firmaPreview ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <div className="flex-1 flex items-center justify-center bg-white border border-gray-200 dark:border-gray-800 rounded-2xl w-full p-4 relative group shadow-sm">
                          <img
                            src={deobfuscateSignature(firmaPreview) || ''}
                            alt="Firma del Técnico"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        
                        {isConfirmingDeleteSig ? (
                          <div className="flex items-center gap-2 mt-3 w-full justify-center">
                            <button
                              type="button"
                              onClick={confirmRemoveSignature}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all min-h-[44px]"
                            >
                              Sí, eliminar
                            </button>
                            <button
                              type="button"
                              onClick={cancelRemoveSignature}
                              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-750 dark:text-gray-300 font-bold text-xs transition-all min-h-[44px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRemoveSignatureClick}
                            className="mt-3 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs transition-all flex items-center gap-1.5 self-center min-h-[44px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar Firma
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-6 text-gray-400">
                        <PenTool className="w-10 h-10 mx-auto mb-2 text-gray-400 opacity-60" />
                        <p className="text-xs font-semibold">No se ha registrado ninguna firma</p>
                        <p className="text-[10.5px] text-gray-500 mt-1 leading-normal max-w-[200px] mx-auto text-center">
                          Dibuja una firma en el panel o sube un archivo de imagen. Los cambios se guardarán al pulsar el botón inferior.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer sticky-like for Submit Button */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-white/5 border-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <AnimatePresence>
              {saved && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold"
                >
                  <Check className="w-5 h-5" />
                  Cambios guardados con éxito
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit"
            disabled={saving || uploadingLogo || uploadingSignature}
            className="w-full sm:w-auto px-6 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Signature Modal */}
      <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
        <DialogContent className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 max-w-lg w-[95vw] rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col items-center">
          <DialogHeader className="w-full mb-4">
            <DialogTitle className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-500" />
              Dibujar Firma
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex justify-end gap-2 mb-3">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleUndoSignature}
                className="px-3 py-2 rounded-xl dark:bg-gray-800 bg-gray-200 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1 text-xs"
              >
                <Undo className="w-3.5 h-3.5" />
                Deshacer
              </button>
            )}
            <button
              type="button"
              onClick={handleClearSignature}
              className="px-3 py-2 rounded-xl dark:bg-gray-800 bg-gray-200 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
            >
              <Eraser className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>

          <div
            ref={sigContainerRef}
            className="w-full border-2 border-dashed rounded-2xl bg-white overflow-hidden relative shadow-inner touch-none dark:border-gray-700 border-gray-300"
            style={{ height: '220px' }}
          >
            {transitionDone && isSignatureModalOpen && (
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                minWidth={1.5}
                maxWidth={4.5}
                canvasProps={{
                  className: 'cursor-crosshair',
                  style: {
                    display: 'block',
                    touchAction: 'none',
                    width: '100%',
                    height: '100%',
                  },
                }}
                onEnd={handleCanvasDrawEnd}
                clearOnResize={false}
              />
            )}
            {sigEmpty && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400 bg-gray-100/80 px-4 py-2 rounded-full shadow-sm">
                  Firma aquí
                </span>
              </div>
            )}
          </div>
          
          <div className="w-full mt-6">
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(false)}
              className="w-full px-6 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Guardar y Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
