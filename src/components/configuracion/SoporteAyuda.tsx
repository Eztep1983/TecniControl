'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/components/auth/AuthProvider'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { 
  HelpCircle, Search, Mail, BookOpen, Send, Check, AlertCircle, ChevronDown, Wrench, FileText, PenTool, Smartphone, Wifi, WifiOff, Laptop, Loader2
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'

// FAQs Data Source (excluding option 3 as requested)
const FAQS = [
  {
    category: "Servicio Técnico",
    question: "¿Cómo funciona el modo sin conexión (offline)?",
    answer: "Puedes crear y editar tus órdenes de servicio normalmente sin señal. Toda la información se almacenará de manera segura en tu celular y se sincronizará automáticamente en segundo plano cuando recuperes conexión a internet.",
    keywords: "offline internet señal conexion offline-mode modo local sincronizacion"
  },
  {
    category: "Servicio Técnico",
    question: "¿Cómo comparto o descargo los reportes PDF?",
    answer: "Dentro de cualquier orden de servicio, pulsa el botón 'Ver Orden' en la barra inferior. Tendrás accesos directos rápidos para descargar el reporte PDF en el almacenamiento local de tu celular o compartirlo directo por WhatsApp y correo electrónico.",
    keywords: "pdf reporte compartir whatsapp descargar descargar pdf imprimir acta"
  },
  {
    category: "Clientes y Contactos",
    question: "¿Cómo funciona la importación de contactos?",
    answer: "Ve a la sección de clientes, abre el modal de importación de contactos y concede permisos. Podrás buscar y seleccionar múltiples contactos de tu libreta de direcciones para importarlos y asociarles equipos al instante, sin tener que digitarlos manualmente.",
    keywords: "contactos importar libreta clientes contactos telefono importar contactos capacitor"
  }
];

// Guides / Step-by-Step Tutorials Data Source
const GUIDES = [
  {
    title: "Crear tu primera orden de servicio",
    icon: Wrench,
    steps: [
      "Abre el panel principal de Órdenes y pulsa el botón '+' (Nueva Orden).",
      "Selecciona el cliente del listado (o importa un contacto nuevo) y asocia el equipo respectivo.",
      "Describe las observaciones iniciales, detalla las tareas realizadas, repuestos y pulsa 'Guardar Cambios'."
    ]
  },
  {
    title: "Buenas prácticas de firma digital táctil",
    icon: PenTool,
    steps: [
      "En el paso final del formulario de la orden, pulsa el recuadro 'Firma del Cliente'.",
      "Entrega el teléfono al cliente para que trace su firma en el lienzo utilizando el dedo o un lápiz óptico.",
      "Asegúrate de completar el nombre y la cédula del cliente receptor, y pulsa 'Validar'."
    ]
  },
  {
    title: "Configurar la identidad del negocio y firma de técnico",
    icon: FileText,
    steps: [
      "Ve a Ajustes > Mi Negocio.",
      "Sube el logotipo comercial de tu negocio (se optimizará a tamaño cuadrado automáticamente).",
      "Dibuja tu firma en el lienzo de técnico y pulsa 'Guardar Cambios' de forma global para que aparezca sola en todos los reportes PDF."
    ]
  }
];

export default function SoporteAyuda() {
  const { user } = useAuth();
  
  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState(FAQS);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(null);

  // Tickets Form States
  const [ticket, setTicket] = useState({
    asunto: '',
    categoria: 'Error Técnico',
    descripcion: ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Diagnostic Stats States
  const [isOnline, setIsOnline] = useState(true);
  const [platform, setPlatform] = useState('Navegador Web');

  // Monitor network status and platform
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPlatform(Capacitor.isNativePlatform() ? 'Capacitor Native' : 'Navegador Web');

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter FAQs based on query
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredFaqs(FAQS);
      return;
    }

    const filtered = FAQS.filter(faq => 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query) ||
      faq.keywords.includes(query)
    );
    setFilteredFaqs(filtered);
    setOpenFaqIndex(null); // Close faq items during filter
  }, [searchQuery]);

  const handleTicketChange = (field: string, val: string) => {
    setTicket(prev => ({ ...prev, [field]: val }));
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!ticket.asunto.trim() || !ticket.descripcion.trim()) {
      setErrorMsg('El asunto y la descripción son obligatorios para crear el ticket.');
      return;
    }

    try {
      setSubmittingTicket(true);
      setErrorMsg('');
      setSuccessMsg('');

      const ticketId = `TKT-${Date.now()}`;
      const ticketRef = doc(db, 'tickets', ticketId);

      await setDoc(ticketRef, {
        id: ticketId,
        userId: user.uid,
        userEmail: user.email || 'correo@desconocido.com',
        asunto: ticket.asunto.trim(),
        categoria: ticket.categoria,
        descripcion: ticket.descripcion.trim(),
        estado: 'abierto',
        createdAt: new Date().toISOString()
      });

      setSuccessMsg('¡Ticket creado con éxito! Nuestro equipo técnico se pondrá en contacto pronto.');
      setTicket({ asunto: '', categoria: 'Error Técnico', descripcion: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar la solicitud de soporte.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8 pb-10 text-left"
    >
      
      {/* 1. base de conocimientos / FAQ */}
      <section className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20">
            <HelpCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Preguntas Frecuentes</h2>
            <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
              Busca y resuelve dudas operativas sobre el uso de la aplicación.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar soluciones (ej. 'Modo offline', 'pdf')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm shadow-sm transition-all text-gray-800 dark:text-slate-200"
          />
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="border dark:border-gray-800 border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] uppercase bg-blue-500/10 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded font-bold mr-3 tracking-wider">
                        {faq.category}
                      </span>
                      <span className="text-sm font-semibold dark:text-gray-200 text-gray-800 leading-normal">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-sm dark:text-gray-400 text-gray-600 leading-relaxed border-t dark:border-gray-800 border-gray-200 bg-white/40 dark:bg-gray-950/10">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              No encontramos resultados para "{searchQuery}". Prueba con otras palabras clave.
            </div>
          )}
        </div>
      </section>

      {/* 2. Guías y Tutoriales */}
      <section className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20">
            <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Guías y Tutoriales</h2>
            <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
              Manuales paso a paso para dominar las funciones de TecniControl.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {GUIDES.map((guide, idx) => {
            const isOpen = openGuideIndex === idx;
            const IconComponent = guide.icon;
            return (
              <div 
                key={idx}
                className="border dark:border-gray-800 border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenGuideIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold dark:text-gray-200 text-gray-800">
                      {guide.title}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-3 border-t dark:border-gray-800 border-gray-200 bg-white/40 dark:bg-gray-950/10 space-y-3.5">
                        {guide.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex gap-3 items-start text-sm">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {sIdx + 1}
                            </div>
                            <p className="dark:text-gray-400 text-gray-600 leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Formulario de Soporte / Tickets */}
      <section className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-500/20">
            <Mail className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">Formulario de Soporte</h2>
            <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
              Describe problemas específicos y envía un ticket directo a nuestro equipo.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                {errorMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Asunto */}
            <div className="space-y-2">
              <label className="text-sm font-semibold dark:text-gray-300 text-gray-700">Asunto</label>
              <input
                type="text"
                placeholder="Ej. Error al descargar PDF"
                value={ticket.asunto}
                onChange={(e) => handleTicketChange('asunto', e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm shadow-sm transition-all text-gray-800 dark:text-slate-200"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-sm font-semibold dark:text-gray-300 text-gray-700">Categoría</label>
              <select
                value={ticket.categoria}
                onChange={(e) => handleTicketChange('categoria', e.target.value)}
                className="w-full h-12 px-4 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm shadow-sm transition-all text-gray-850 dark:text-slate-200"
              >
                <option value="Error Técnico">Error Técnico</option>
                <option value="Sugerencia">Sugerencia</option>
                <option value="Duda sobre facturación">Duda sobre facturación</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-semibold dark:text-gray-300 text-gray-700">Descripción del problema</label>
            <textarea
              placeholder="Por favor describe detalladamente la situación y los pasos para reproducir el error técnico..."
              value={ticket.descripcion}
              onChange={(e) => handleTicketChange('descripcion', e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl dark:bg-gray-950/50 bg-white border dark:border-white/10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-sm shadow-sm transition-all text-gray-800 dark:text-slate-200 min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={submittingTicket}
            className="w-full sm:w-auto px-6 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
          >
            {submittingTicket ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando ticket...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Solicitud
              </>
            )}
          </button>
        </form>
      </section>

      {/* 4. Enlaces de soporte e Info de la App */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Contacto Directo & Políticas */}
        <div className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold dark:text-gray-200 text-slate-800">Contacto Directo</h3>
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-1 leading-normal">
              Escríbenos directamente para consultas generales o comerciales de soporte.
            </p>
            <a 
              href="mailto:tecnicontrolprueba@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline min-h-[44px]"
            >
              <Mail className="w-4.5 h-4.5" />
              tecnicontrolprueba@gmail.com
            </a>
          </div>

          <div className="border-t dark:border-gray-800 border-gray-200 pt-4 mt-4 flex items-center gap-4 text-xs font-semibold text-gray-500">
            <a href="/legal/terminos-servicio" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 min-h-[44px] flex items-center">
              Términos de Uso
            </a>
            <span>•</span>
            <a href="/legal/politica-privacidad" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 min-h-[44px] flex items-center">
              Políticas de Privacidad
            </a>
          </div>
        </div>

        {/* Diagnóstico técnico */}
        <div className="dark:bg-gray-900/60 bg-white border dark:border-white/10 border-gray-200 shadow-xl shadow-blue-900/5 rounded-[2rem] p-6">
          <h3 className="text-base font-bold dark:text-gray-255 text-slate-800 flex items-center gap-1.5">
            <Laptop className="w-4.5 h-4.5 text-blue-500" />
            Estado del Sistema
          </h3>
          <p className="text-xs dark:text-gray-400 text-gray-500 mt-1 leading-normal">
            Información de diagnóstico técnico y conectividad actual del cliente.
          </p>

          <div className="mt-4 space-y-2 text-xs font-medium dark:text-gray-300 text-gray-700">
            {/* Version */}
            <div className="flex justify-between border-b dark:border-gray-800 border-gray-200 pb-1.5">
              <span className="text-gray-500">Versión de App:</span>
              <span className="font-semibold dark:text-white text-gray-900">TecniControl v1.1.0</span>
            </div>

            {/* Connection */}
            <div className="flex justify-between border-b dark:border-gray-800 border-gray-200 pb-1.5 items-center">
              <span className="text-gray-500">Estado de Red:</span>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">En línea</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-500 font-bold">Modo Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Platform */}
            <div className="flex justify-between pb-0.5">
              <span className="text-gray-500">Plataforma:</span>
              <span className="dark:text-white text-gray-900 font-semibold">{platform}</span>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
