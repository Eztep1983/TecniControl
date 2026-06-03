import { useRef, useCallback, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export interface SignatureState {
  habilitada: boolean
  firma: string | null
  validada: boolean
}

export function useSignatureCanvas(
  containerRef: React.RefObject<HTMLDivElement>,
  sigCanvas: React.RefObject<SignatureCanvas>,
  firma: string | null,
  setFirma: (firma: string | null) => void
) {
  const initializedRef = useRef(false)
  const resizeTimerRef = useRef<NodeJS.Timeout>()

  const restoreSignature = useCallback(() => {
    if (firma && sigCanvas.current) {
      try {
        sigCanvas.current.fromDataURL(firma)
      } catch (e) {
        console.error('Error restaurando firma:', e)
      }
    }
  }, [firma, sigCanvas])

  const resizeCanvas = useCallback(() => {
    const canvas = sigCanvas.current?.getCanvas()
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const currentData = sigCanvas.current?.toData() || []

    canvas.width = container.offsetWidth * ratio
    canvas.height = container.offsetHeight * ratio

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(ratio, ratio)
    }

    sigCanvas.current?.clear()
    if (currentData.length > 0) {
      sigCanvas.current?.fromData(currentData)
    } else if (firma) {
      restoreSignature()
    }
    initializedRef.current = true
  }, [sigCanvas, containerRef, firma, restoreSignature])

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(resizeCanvas, 100)
    })

    observer.observe(containerRef.current)
    if (!initializedRef.current) {
      resizeCanvas()
    }

    return () => {
      observer.disconnect()
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    }
  }, [resizeCanvas, containerRef])

  const guardarFirma = useCallback(() => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        setFirma(null)
      } else {
        const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png')
        setFirma(dataUrl)
      }
    }
  }, [sigCanvas, setFirma])

  const limpiarFirma = useCallback(() => {
    sigCanvas.current?.clear()
    setFirma(null)
  }, [sigCanvas, setFirma])

  return { guardarFirma, limpiarFirma }
}
