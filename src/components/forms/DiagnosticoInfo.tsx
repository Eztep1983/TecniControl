// components/forms/DiagnosticoInfo.tsx
'use client'
import { FileText, AlertCircle, Activity, Mic, MicOff, CheckCircle2 } from 'lucide-react'
import React, { memo, useCallback, useMemo, useState, useEffect, useRef, useId } from 'react'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

interface DiagnosticoInfoProps {
  observacionesIniciales: string
  pruebasRealizadas: string
  diagnosticoFinal: string
  onCambiarObservaciones: (valor: string) => void
  onCambiarPruebas: (valor: string) => void
  onCambiarDiagnostico: (valor: string) => void
}

// ─── Singleton de audio: solo 1 campo graba a la vez ─────────────────────────
// Evita el race condition donde todos los campos reciben partialResults
const audioManager = {
  activeFieldId: null as string | null,
  listeners: new Map<string, (matches: string[]) => void>(),

  register(id: string, handler: (matches: string[]) => void) {
    this.listeners.set(id, handler)
  },

  unregister(id: string) {
    this.listeners.delete(id)
    if (this.activeFieldId === id) this.activeFieldId = null
  },

  setActive(id: string | null) {
    this.activeFieldId = id
  },

  dispatch(matches: string[]) {
    if (this.activeFieldId) {
      this.listeners.get(this.activeFieldId)?.(matches)
    }
  },
}

// ─── Inicialización global de listeners (una sola vez por sesión) ────────────
let globalListenerReady = false

// Configuración de reinicio automático al detectar silencio
const restartManager = {
  // Función que el campo activo registra para reiniciarse
  restartFn: null as (() => Promise<void>) | null,

  setRestart(fn: (() => Promise<void>) | null) {
    this.restartFn = fn
  },

  async triggerRestart() {
    if (this.restartFn) {
      // Pequeña pausa para que el sistema de audio libere recursos antes de reiniciar
      await new Promise(r => setTimeout(r, 250))
      await this.restartFn?.()
    }
  },
}

async function ensureGlobalListener() {
  if (globalListenerReady) return
  globalListenerReady = true
  try {
    // Listener de resultados parciales → despacha al campo activo
    await SpeechRecognition.addListener(
      'partialResults',
      (data: { matches?: string[] }) => {
        if (data?.matches?.length) {
          audioManager.dispatch(data.matches)
        }
      }
    )

    // Listener de estado → detecta cuando el SO corta por silencio y reinicia
    await SpeechRecognition.addListener(
      'listeningState',
      (state: { status: string }) => {
        // 'stopped' llega cuando el SO corta la sesión por silencio o timeout
        if (state?.status === 'stopped') {
          // Solo reiniciamos si hay un campo que sigue queriendo grabar
          restartManager.triggerRestart()
        }
      }
    )
  } catch (e) {
    console.error('[Speech] global listener error:', e)
    globalListenerReady = false
  }
}

// ─── Hook de voz ─────────────────────────────────────────────────────────────
function useSpeechInput(
  value: string,
  onChange: (v: string) => void,
  label: string
) {
  const fieldId = useId()

  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  // baseTextRef: lo que había ANTES de esta sesión de grabación continua.
  // Se actualiza al confirmar lo reconocido (en partialResults) para que
  // cada reinicio por silencio acumule sobre el texto ya dictado.
  const baseTextRef = useRef('')
  const isRecordingRef = useRef(false)
  // Texto reconocido en la sesión actual (antes de reiniciar)
  const lastRecognizedRef = useRef('')

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { valueRef.current = value }, [value])

  // ── Inicialización ──
  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const { available } = await SpeechRecognition.available()
        if (!mounted) return
        setIsAvailable(available)
        if (!available) return

        await ensureGlobalListener()

        const { speechRecognition } = await SpeechRecognition.checkPermissions()
        if (!mounted) return
        if (speechRecognition === 'granted') {
          setHasPermission(true)
        } else {
          const res = await SpeechRecognition.requestPermissions()
          if (mounted) setHasPermission(res.speechRecognition === 'granted')
        }
      } catch (e) {
        console.error('[Speech] init error:', e)
        if (mounted) { setIsAvailable(false); setHasPermission(false) }
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  // ── Handler de partialResults: acumula texto correctamente entre reinicios ──
  useEffect(() => {
    audioManager.register(fieldId, (matches: string[]) => {
      const recognized = matches[0]
      lastRecognizedRef.current = recognized

      const base = baseTextRef.current.trim()
      const needsSeparator = base && !/[.,!?]$/.test(base)
      const newValue = base
        ? `${base}${needsSeparator ? '. ' : ' '}${recognized}`
        : recognized

      onChangeRef.current(newValue)
    })
    return () => audioManager.unregister(fieldId)
  }, [fieldId])

  // ── Función interna de inicio (sin efectos secundarios de estado) ──
  // La usamos tanto en startListening como en el auto-restart
  const doStart = useCallback(async () => {
    try {
      await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 1,
        prompt: `Dictando: ${label}`,
        partialResults: true,
        popup: false,
      })
    } catch (e: any) {
      if (e?.message?.includes('already started') || e?.code === 'ALREADY_RUNNING') {
        // Ya estaba corriendo; ignorar
        return
      }
      console.error('[Speech] doStart error:', e)
      // Si falla de verdad, dejamos de intentar
      isRecordingRef.current = false
      audioManager.setActive(null)
      restartManager.setRestart(null)
      setIsRecording(false)
    }
  }, [label])

  // ── Auto-restart: se llama desde restartManager cuando el SO corta por silencio ──
  const autoRestart = useCallback(async () => {
    // Solo reiniciamos si este campo sigue queriendo grabar
    if (!isRecordingRef.current || audioManager.activeFieldId !== fieldId) return

    // Confirmar el último texto reconocido como nueva base para seguir acumulando
    if (lastRecognizedRef.current) {
      baseTextRef.current = valueRef.current
      lastRecognizedRef.current = ''
    }

    await doStart()
  }, [fieldId, doStart])

  const requestPermission = useCallback(async () => {
    try {
      const res = await SpeechRecognition.requestPermissions()
      setHasPermission(res.speechRecognition === 'granted')
      return res.speechRecognition === 'granted'
    } catch (e) {
      console.error('[Speech] requestPermissions error:', e)
      return false
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!isAvailable) {
      alert('El reconocimiento de voz no está disponible en este dispositivo')
      return
    }

    let permitted = hasPermission
    if (!permitted) {
      permitted = await requestPermission()
      if (!permitted) return
    }

    // Si otro campo graba, detenerlo primero
    if (audioManager.activeFieldId && audioManager.activeFieldId !== fieldId) {
      restartManager.setRestart(null)
      try { await SpeechRecognition.stop() } catch (_) {}
      await new Promise(r => setTimeout(r, 150))
    }

    // Inicializar estado
    baseTextRef.current = valueRef.current
    lastRecognizedRef.current = ''
    audioManager.setActive(fieldId)
    isRecordingRef.current = true
    setIsRecording(true)

    // Registrar función de auto-restart para este campo
    restartManager.setRestart(autoRestart)

    await doStart()
  }, [isAvailable, hasPermission, fieldId, requestPermission, autoRestart, doStart])

  const stopListening = useCallback(async () => {
    isRecordingRef.current = false
    audioManager.setActive(null)
    restartManager.setRestart(null) // cancelar auto-restart
    setIsRecording(false)
    try {
      await SpeechRecognition.stop()
    } catch (e) {
      console.error('[Speech] stop error:', e)
    }
  }, [])

  // Limpiar si el componente se desmonta mientras graba
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        isRecordingRef.current = false
        audioManager.setActive(null)
        restartManager.setRestart(null)
        SpeechRecognition.stop().catch(() => {})
      }
    }
  }, [])

  return {
    isRecording,
    hasPermission,
    isAvailable,
    startListening,
    stopListening,
    requestPermission,
  }
}

// ─── Haptic feedback ──────────────────────────────────────────────────────────
const useHapticFeedback = () =>
  useCallback((duration = 10) => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(duration)
    }
  }, [])

// ─── SectionHeader ────────────────────────────────────────────────────────────
const SectionHeader = memo(({
  icon: Icon,
  title,
  description,
  colorClass,
  itemCount,
  isComplete,
}: {
  icon: React.ComponentType<any>
  title: string
  description: string
  colorClass?: string
  itemCount?: number
  isComplete?: boolean
}) => (
  <div className="flex items-start gap-4 mb-5">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
      colorClass || 'bg-gray-700/50 text-gray-400'
    }`}>
      {isComplete
        ? <CheckCircle2 className="w-6 h-6 text-white" />
        : <Icon className="w-6 h-6" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{title}</h3>
        {!!itemCount && itemCount > 0 && (
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
            {itemCount} elemento{itemCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{description}</p>
    </div>
  </div>
))
SectionHeader.displayName = 'SectionHeader'

// ─── MicButton ────────────────────────────────────────────────────────────────
const MicButton = memo(({
  isRecording,
  hasPermission,
  isAvailable,
  onStart,
  onStop,
}: {
  isRecording: boolean
  hasPermission: boolean | null
  isAvailable: boolean
  onStart: () => void
  onStop: () => void
}) => {
  if (!isAvailable) return null

  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={hasPermission === false}
      aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación de voz'}
      title={
        hasPermission === false
          ? 'Se necesita permiso de micrófono'
          : isRecording
            ? 'Toca para detener'
            : 'Toca para dictar por voz'
      }
      className={`
        absolute top-3 right-3 p-2.5 rounded-xl transition-all duration-200
        touch-manipulation select-none
        ${isRecording
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110'
          : hasPermission === false
            ? 'bg-gray-700/30 text-gray-600 cursor-not-allowed'
            : 'bg-gray-700/60 text-gray-400 active:scale-95 active:bg-blue-500/30'
        }
      `}
    >
      {isRecording
        ? <MicOff className="w-5 h-5" />
        : <Mic className="w-5 h-5" />}

      {/* Ondas animadas mientras graba */}
      {isRecording && (
        <span className="absolute inset-0 rounded-xl">
          <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping" />
        </span>
      )}
    </button>
  )
})
MicButton.displayName = 'MicButton'

// ─── RecordingIndicator ───────────────────────────────────────────────────────
const RecordingIndicator = memo(({ isRecording, onStop }: {
  isRecording: boolean
  onStop: () => void
}) => {
  if (!isRecording) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-xs text-red-400 font-medium">
        Escuchando… habla en español
      </span>
      <button
        type="button"
        onClick={onStop}
        className="ml-auto text-xs text-red-400 underline touch-manipulation min-h-[32px] px-1"
      >
        Detener
      </button>
    </div>
  )
})
RecordingIndicator.displayName = 'RecordingIndicator'

// ─── PermissionWarning ────────────────────────────────────────────────────────
const PermissionWarning = memo(({ show, onRequest }: {
  show: boolean
  onRequest: () => void
}) => {
  if (!show) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <span className="text-xs text-yellow-400">Se necesita permiso de micrófono</span>
      <button
        type="button"
        onClick={onRequest}
        className="ml-auto text-xs text-yellow-400 underline touch-manipulation"
      >
        Solicitar
      </button>
    </div>
  )
})
PermissionWarning.displayName = 'PermissionWarning'

// ─── TextAreaField ────────────────────────────────────────────────────────────
const TextAreaField = memo(({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  helpText,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  rows?: number
  required?: boolean
  helpText?: string
}) => {
  const vibrate = useHapticFeedback()
  const speech = useSpeechInput(value, onChange, label)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleClear = useCallback(() => {
    vibrate(5)
    onChange('')
    textareaRef.current?.focus()
  }, [onChange, vibrate])

  const itemCount = useMemo(
    () => value.split(/[,.]/).filter(s => s.trim().length > 0).length,
    [value]
  )

  const handleStart = useCallback(() => {
    vibrate(8)
    speech.startListening()
  }, [speech, vibrate])

  const handleStop = useCallback(() => {
    vibrate(5)
    speech.stopListening()
  }, [speech, vibrate])

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex justify-between items-center px-1">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <span className="text-[10px] text-gray-500 bg-gray-700/30 px-2 py-1 rounded-full">
              {itemCount}
            </span>
          )}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-500 active:text-red-400 font-medium transition-colors touch-manipulation min-h-[44px] px-2"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Textarea + mic */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{ fontSize: '16px' }}
          className={`
            w-full px-4 py-4 pr-14
            bg-gray-900/40 border-2 rounded-2xl
            text-white placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
            transition-all resize-none shadow-inner
            ${speech.isRecording ? 'border-red-500/40' : 'border-gray-700/50'}
          `}
        />

        <MicButton
          isRecording={speech.isRecording}
          hasPermission={speech.hasPermission}
          isAvailable={speech.isAvailable}
          onStart={handleStart}
          onStop={handleStop}
        />
      </div>

      {/* Estados del micrófono */}
      <RecordingIndicator isRecording={speech.isRecording} onStop={handleStop} />
      <PermissionWarning
        show={speech.isAvailable && speech.hasPermission === false}
        onRequest={speech.requestPermission}
      />

      {/* Help text */}
      {helpText && !speech.isRecording && (
        <p className="text-[11px] text-gray-600 px-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0 text-gray-600" />
          {helpText}
        </p>
      )}
    </div>
  )
})
TextAreaField.displayName = 'TextAreaField'

// ─── Componente principal ─────────────────────────────────────────────────────
const DiagnosticoInfo = memo(function DiagnosticoInfo({
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  onCambiarObservaciones,
  onCambiarPruebas,
  onCambiarDiagnostico,
}: DiagnosticoInfoProps) {
  const count = (s: string) =>
    s.split(/[,.]/).filter(t => t.trim().length > 0).length

  const isComplete = (s: string) => s.trim().length > 10

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 touch-pan-y">

      {/* Observaciones Iniciales */}
      <section className={`
        bg-gray-800/40 rounded-3xl p-6 border shadow-xl transition-all duration-300
        ${isComplete(observacionesIniciales)
          ? 'border-blue-500/30 shadow-blue-500/5'
          : 'border-gray-700/50'}
      `}>
        <SectionHeader
          icon={FileText}
          title="Observación Inicial"
          description="Estado del equipo al recibirlo"
          colorClass="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20"
          itemCount={count(observacionesIniciales)}
          isComplete={isComplete(observacionesIniciales)}
        />
        <TextAreaField
          label="Observaciones de Entrada"
          placeholder="Ej: Atasca papel, copia con líneas verticales…"
          value={observacionesIniciales}
          onChange={onCambiarObservaciones}
          rows={3}
          required
          helpText="Síntomas y estado físico actual. Toca el micrófono para dictar."
        />
      </section>

      {/* Pruebas Realizadas */}
      <section className={`
        bg-gray-800/40 rounded-3xl p-6 border shadow-xl transition-all duration-300
        ${isComplete(pruebasRealizadas)
          ? 'border-purple-500/30 shadow-purple-500/5'
          : 'border-gray-700/50'}
      `}>
        <SectionHeader
          icon={Activity}
          title="Procedimientos"
          description="Acciones técnicas ejecutadas"
          colorClass="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/20"
          itemCount={count(pruebasRealizadas)}
          isComplete={isComplete(pruebasRealizadas)}
        />
        <TextAreaField
          label="Pruebas Realizadas"
          placeholder="Ej: Test de unidad de imagen y rodillos de alimentación…"
          value={pruebasRealizadas}
          onChange={onCambiarPruebas}
          rows={3}
          required
          helpText="Enumera las pruebas clave del análisis técnico. Toca el micrófono para dictar."
        />
      </section>

      {/* Diagnóstico Final */}
      <section className={`
        bg-gray-800/40 rounded-3xl p-6 border shadow-xl transition-all duration-300
        ${isComplete(diagnosticoFinal)
          ? 'border-green-500/30 shadow-green-500/5'
          : 'border-gray-700/50'}
      `}>
        <SectionHeader
          icon={AlertCircle}
          title="Conclusión"
          description="Veredicto final del servicio técnico"
          colorClass="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/20"
          itemCount={count(diagnosticoFinal)}
          isComplete={isComplete(diagnosticoFinal)}
        />
        <TextAreaField
          label="Diagnóstico Final"
          placeholder="Ej: Requiere cambio de cilindros y cuchilla de limpieza…"
          value={diagnosticoFinal}
          onChange={onCambiarDiagnostico}
          rows={3}
          required
          helpText="Conclusión para informar al cliente y generar presupuesto. Toca el micrófono para dictar."
        />
      </section>

      {/* Tips */}
      <div className="border border-blue-500/30 bg-blue-500/5 rounded-3xl p-5 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            Tips para un diagnóstico profesional
          </h4>
          <ul className="text-sm text-gray-400 leading-relaxed space-y-1">
            <li>• Sé específico y objetivo en las observaciones</li>
            <li>• Documenta todas las pruebas, incluso las que salieron bien</li>
            <li>• El diagnóstico debe incluir causa raíz y solución propuesta</li>
            <li>• El micrófono funciona mejor en ambientes silenciosos</li>
            <li>• Solo un campo puede grabar a la vez</li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, button { font-size: 16px; }
      `}</style>
    </div>
  )
})
DiagnosticoInfo.displayName = 'DiagnosticoInfo'

export default DiagnosticoInfo