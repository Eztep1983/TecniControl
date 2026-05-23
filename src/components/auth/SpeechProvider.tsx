// src/components/auth/SpeechProvider.tsx
'use client'
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SpeechContextType {
  /** Campo que está grabando actualmente (por su label) o null */
  activeField: string | null
  isAvailable: boolean
  startRecording: (
    onResult: (text: string) => void,
    label: string,
    currentValue: string
  ) => Promise<void>
  stopRecording: () => Promise<void>
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SpeechContext = createContext<SpeechContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const SpeechProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeField, setActiveField] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  // ── Refs internos ──────────────────────────────────────────────────────────
  const activeFieldRef = useRef<string | null>(null)
  const onResultRef    = useRef<((text: string) => void) | null>(null)

  /**
   * baseText: texto que ya estaba en el campo antes de iniciar la sesión
   * actual o antes de un auto-restart. Los resultados parciales se SUMAN
   * a este valor, nunca lo reemplazan.
   */
  const baseTextRef    = useRef<string>('')

  /**
   * lastPartial: último fragmento parcial recibido. Al hacer auto-restart se
   * "consolida" en baseText para que no se pierda.
   */
  const lastPartialRef = useRef<string>('')

  /** Listener handles de Capacitor (async remove) */
  const listenersRef   = useRef<{ remove: () => Promise<void> }[]>([])

  // ── Disponibilidad ─────────────────────────────────────────────────────────
  useEffect(() => {
    SpeechRecognition.available()
      .then(({ available }) => setIsAvailable(available))
      .catch(() => setIsAvailable(false))
  }, [])

  // ── Mantener ref sincronizada con el estado ────────────────────────────────
  useEffect(() => {
    activeFieldRef.current = activeField
  }, [activeField])

  // ── Helpers internos ───────────────────────────────────────────────────────

  /** Elimina todos los listeners correctamente (son async) */
  const removeAllListeners = useCallback(async () => {
    const current = listenersRef.current
    listenersRef.current = []
    await Promise.all(current.map(l => l.remove().catch(() => {})))
  }, [])

  /** Combina baseText + fragmento parcial en un string limpio */
  const buildText = (base: string, partial: string): string => {
    const b = base.trim()
    const p = partial.trim()
    if (!b) return p
    if (!p) return b
    // Añade separador si el base no termina en puntuación
    const needsSep = !/[.,;:!?]$/.test(b)
    return `${b}${needsSep ? '. ' : ' '}${p}`
  }

  /** Inicia el motor de reconocimiento (sin tocar listeners ni estado) */
  const doStart = useCallback(async (label: string) => {
    try {
      await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 1,
        prompt: `Dictando: ${label}`,
        partialResults: true,
        popup: false,
      })
    } catch (e: any) {
      // "already started" no es un error real
      if (
        e?.message?.includes('already started') ||
        e?.code === 'ALREADY_RUNNING'
      ) return
      throw e
    }
  }, [])

  // ── stopRecording ──────────────────────────────────────────────────────────

  const stopRecording = useCallback(async () => {
    activeFieldRef.current = null
    onResultRef.current    = null
    baseTextRef.current    = ''
    lastPartialRef.current = ''

    await removeAllListeners()

    try {
      await SpeechRecognition.stop()
    } catch (_) {}

    setActiveField(null)
  }, [removeAllListeners])

  // ── startRecording ─────────────────────────────────────────────────────────

  const startRecording = useCallback(
    async (
      onResult: (text: string) => void,
      label: string,
      currentValue: string
    ) => {
      // Mutex: si hay algo grabando, detenerlo limpiamente antes
      if (activeFieldRef.current) {
        await stopRecording()
        // Pequeña pausa para que el motor de voz libere el recurso
        await new Promise(r => setTimeout(r, 200))
      }

      // ── Permisos ──
      try {
        const { speechRecognition } = await SpeechRecognition.checkPermissions()
        if (speechRecognition !== 'granted') {
          const res = await SpeechRecognition.requestPermissions()
          if (res.speechRecognition !== 'granted') return
        }
      } catch (e) {
        console.error('[Speech] Permissions error:', e)
        return
      }

      // ── Inicializar estado para esta sesión ──
      onResultRef.current    = onResult
      baseTextRef.current    = currentValue  // ← texto previo del campo
      lastPartialRef.current = ''
      activeFieldRef.current = label
      setActiveField(label)

      // ── Registrar listeners ──
      await removeAllListeners()

      const partialHandle = await SpeechRecognition.addListener(
        'partialResults',
        (data: { matches?: string[] }) => {
          const partial = data?.matches?.[0] ?? ''
          if (!partial) return
          lastPartialRef.current = partial
          const combined = buildText(baseTextRef.current, partial)
          onResultRef.current?.(combined)
        }
      )

      const stateHandle = await SpeechRecognition.addListener(
        'listeningState',
        (state: { status: string }) => {
          if (state.status !== 'stopped') return
          // Solo hacer auto-restart si seguimos en el mismo campo
          if (!activeFieldRef.current) return

          // Consolidar el último parcial en baseText antes de reiniciar
          if (lastPartialRef.current) {
            baseTextRef.current = buildText(
              baseTextRef.current,
              lastPartialRef.current
            )
            lastPartialRef.current = ''
          }

          // Auto-restart: pequeño delay para evitar race condition en Android
          setTimeout(() => {
            if (!activeFieldRef.current) return
            doStart(currentLabel.current).catch(err => {
              console.error('[Speech] Auto-restart failed:', err)
              stopRecording()
            })
          }, 100)
        }
      )

      listenersRef.current = [partialHandle, stateHandle]

      // ── Arrancar ──
      try {
        await doStart(label)
      } catch (e) {
        console.error('[Speech] Start error:', e)
        await stopRecording()
      }
    },
    [stopRecording, removeAllListeners, doStart]
  )

  // Ref auxiliar para que el closure de stateHandle tenga el label actual
  const currentLabel = useRef<string>('')
  useEffect(() => {
    currentLabel.current = activeField ?? ''
  }, [activeField])

  // ── Cleanup al desmontar ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeFieldRef.current = null
      removeAllListeners()
      SpeechRecognition.stop().catch(() => {})
    }
  }, [removeAllListeners])

  return (
    <SpeechContext.Provider
      value={{ activeField, isAvailable, startRecording, stopRecording }}
    >
      {children}
    </SpeechContext.Provider>
  )
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────

export const useSpeech = () => {
  const ctx = useContext(SpeechContext)
  if (!ctx) throw new Error('useSpeech must be used within <SpeechProvider>')
  return ctx
}