'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { PiezaPredefinida } from '@/lib/configuracion-helpers'

// ─── Tipos e inicializadores ──────────────────────────────────────────────

export type FormPieza = {
  nombre: string
  categoria: string
}

export const FORM_PIEZA_VACIO: FormPieza = {
  nombre: '',
  categoria: 'Categoría Genérica',
}

const colorStyles = {
  blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-purple-500/10 hover:bg-purple-500/25 active:bg-purple-500/30',
}

// ─── Componente Formulario (Memoizado) ────────────────────────────────────

const FormularioPieza = memo(({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  color = 'purple',
}: {
  form: FormPieza
  onChange: (f: FormPieza) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
  color?: 'blue' | 'purple'
}) => {
  const accentClass = colorStyles[color]

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-4">
        <div className="group">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Nombre del repuesto *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => onChange({ ...form, nombre: e.target.value })}
            placeholder="Ej: Filtro de aceite"
            className="
              w-full min-h-[52px] px-4
              bg-slate-800/50 border border-slate-700/50 rounded-2xl
              text-white placeholder-slate-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50
              transition-all
            "
          />
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
            Categoría
          </label>
          <input
            type="text"
            value={form.categoria}
            onChange={e => onChange({ ...form, categoria: e.target.value })}
            placeholder="Ej: Filtros, Eléctrico…"
            className="
              w-full min-h-[52px] px-4
              bg-slate-800/50 border border-slate-700/50 rounded-2xl
              text-white placeholder-slate-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50
              transition-all
            "
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onSubmit}
          type="button"
          className={`
            w-full min-h-[54px] rounded-2xl font-bold text-sm
            shadow-lg active:scale-[0.98] 
            touch-manipulation transition-all flex items-center justify-center gap-2
            ${accentClass}
          `}
        >
          <CheckCircle className="w-4 h-4" />
          {submitLabel}
        </button>
        
        {onCancel && (
          <button
            onClick={onCancel}
            type="button"
            className="
              w-full min-h-[54px] rounded-2xl font-bold text-sm
              text-slate-400 active:bg-slate-800 touch-manipulation transition-all
            "
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
})

FormularioPieza.displayName = 'FormularioPieza'

// ─── Componente Modal Principal ───────────────────────────────────────────

interface ModalPiezaProps {
  isOpen: boolean
  onClose: () => void
  pieza: PiezaPredefinida | null // Si está presente, es modo edición. Si es null, es creación.
  onSubmit: (data: FormPieza) => void
}

export function ModalPieza({ isOpen, onClose, pieza, onSubmit }: ModalPiezaProps) {
  const [form, setForm] = useState<FormPieza>(FORM_PIEZA_VACIO)

  // Sincronizar estado cuando se abre o cambia el elemento seleccionado
  useEffect(() => {
    if (isOpen) {
      if (pieza) {
        setForm({
          nombre: pieza.nombre,
          categoria: pieza.categoria,
        })
      } else {
        setForm(FORM_PIEZA_VACIO)
      }
    }
  }, [isOpen, pieza])

  // onChange estable
  const handleFormChange = useCallback((updatedForm: FormPieza) => {
    setForm(updatedForm)
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(form)
  }, [onSubmit, form])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pieza ? 'Editar repuesto' : 'Nuevo repuesto'}
    >
      <FormularioPieza
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={pieza ? 'Guardar cambios' : 'Agregar repuesto'}
        color="purple"
      />
    </Modal>
  )
}
