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
  blue: 'bg-blue-500/20 dark:text-blue-300 text-blue-700 border border-blue-500/30 shadow-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/30',
  purple: 'bg-purple-500/20 dark:text-purple-300 text-purple-700 border border-purple-500/30 shadow-purple-500/10 hover:bg-purple-500/25 active:bg-purple-500/30',
}

// ─── Componente Formulario (Memoizado) ────────────────────────────────────

const FormularioPieza = memo(({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  color = 'purple',
  categoriasSugeridas,
}: {
  form: FormPieza
  onChange: (f: FormPieza) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
  color?: 'blue' | 'purple'
  categoriasSugeridas: string[]
}) => {
  const accentClass = colorStyles[color]

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="flex flex-col gap-5"
    >
      <div className="space-y-4">
        <div className="group">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
            Nombre del repuesto *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={form.nombre}
            onChange={e => onChange({ ...form, nombre: e.target.value })}
            placeholder="Ej: Filtro de aceite"
            className="
              w-full min-h-[52px] px-4
              dark:bg-gray-800/50 bg-gray-200 border dark:border-gray-700/50 border-gray-300 rounded-2xl
              dark:text-white text-gray-900 placeholder-gray-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50
              transition-all
            "
          />
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
            Categoría
          </label>
          <input
            type="text"
            list="categorias-piezas-list"
            value={form.categoria}
            onChange={e => onChange({ ...form, categoria: e.target.value })}
            placeholder="Ej: Filtros, Eléctrico…"
            className="
              w-full min-h-[52px] px-4
              dark:bg-gray-800/50 bg-gray-200 border dark:border-gray-700/50 border-gray-300 rounded-2xl
              dark:text-white text-gray-900 placeholder-gray-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50
              transition-all
            "
          />
          <datalist id="categorias-piezas-list">
            {categoriasSugeridas.map((cat, i) => (
              <option key={i} value={cat} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
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
              dark:text-gray-400 text-gray-600 active:dark:bg-gray-800 active:bg-gray-200 touch-manipulation transition-all
            "
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
})

FormularioPieza.displayName = 'FormularioPieza'

// ─── Componente Modal Principal ───────────────────────────────────────────

interface ModalPiezaProps {
  isOpen: boolean
  onClose: () => void
  pieza: PiezaPredefinida | null // Si está presente, es modo edición. Si es null, es creación.
  onSubmit: (data: FormPieza) => void
  categoriasSugeridas: string[]
}

export function ModalPieza({ isOpen, onClose, pieza, onSubmit, categoriasSugeridas }: ModalPiezaProps) {
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
        categoriasSugeridas={categoriasSugeridas}
      />
    </Modal>
  )
}
