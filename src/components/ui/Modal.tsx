'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useAndroidBack } from '@/hooks/useAndroidBack'

// ─── Hook de keyboard avoidance para iOS / Android ─────────────────────
export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      // Calculamos la diferencia entre la ventana total y el área visible
      const diff = window.innerHeight - vv.height
      setOffset(Math.max(0, diff))
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return offset
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const keyboardOffset = useKeyboardOffset()
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Interceptar gesto/botón de atrás de Android y navegador
  useAndroidBack(isOpen, onClose)

  // Sincronizar visibilidad para animaciones (apertura y cierre de 300ms)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      const t = setTimeout(() => setIsVisible(true), 20)
      return () => clearTimeout(t)
    } else {
      setIsVisible(false)
      const t = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  if (!shouldRender || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        style={{
          // Levantamos el modal si el teclado está abierto (UX optimizado para Android/iOS)
          // Usamos una traslación más agresiva pero limitada para asegurar visibilidad
          transform: isVisible 
            ? `translateY(calc(-${keyboardOffset}px * 0.45)) scale(1)` 
            : `translateY(calc(-${keyboardOffset}px * 0.45 + 40px)) scale(0.95)`,
          opacity: isVisible ? 1 : 0,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: keyboardOffset > 0 ? `calc(100dvh - ${keyboardOffset}px - 20px)` : '85dvh',
        }}
        className="
          relative bg-slate-900 w-full max-w-[min(400px,95vw)] rounded-[2.5rem]
          shadow-2xl border border-slate-700/60 flex flex-col overflow-hidden
          ring-1 ring-white/10 transform-gpu will-change-[transform,opacity]
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 shrink-0">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="
              w-10 h-10 flex items-center justify-center rounded-2xl
              bg-slate-800 text-slate-400 hover:text-white
              active:scale-90 transition-all touch-manipulation
            "
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de Contenido Scrolleable */}
        <div
          className="p-6 overflow-y-auto overscroll-contain flex-1 custom-scrollbar"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: keyboardOffset > 0 ? '2rem' : '1.5rem' 
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
