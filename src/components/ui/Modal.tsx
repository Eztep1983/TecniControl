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
  title: React.ReactNode
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
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-6 pointer-events-auto"
      style={{
        backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0)',
        transition: 'background-color 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        style={{
          transform: isVisible 
            ? 'translateY(0) scale(1)' 
            : 'translateY(40px) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 'env(safe-area-inset-bottom)'
        }}
        className={`
          bg-slate-900 w-full flex flex-col overflow-hidden relative
          shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-t border-x border-slate-700/60 sm:border
          rounded-t-[2.5rem] sm:rounded-[2.5rem]
          max-h-[92dvh]
          sm:h-auto sm:max-w-md sm:max-h-[85vh]
          transform-gpu will-change-[transform,opacity]
        `}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag Handle - Visible on all devices when in sheet mode */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/50 shrink-0 relative">
          {typeof title === 'string' ? (
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          ) : (
            title
          )}
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
            paddingBottom: '1.5rem' 
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
