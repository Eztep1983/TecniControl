'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { TareaPredefinida } from '@/lib/configuracion-helpers'

// ─── Tipos e inicializadores ──────────────────────────────────────────────

export type FormTarea = {
  nombre: string
  tipo: TareaPredefinida['tipo']
  categoria: string
}

export const FORM_TAREA_VACIO: FormTarea = {
  nombre: '',
  tipo: 'preventivo',
  categoria: 'General',
}

const colorStyles = {
  blue: 'bg-blue-500/20 dark:text-blue-300 text-blue-700 border border-blue-500/30 shadow-blue-500/10 hover:bg-blue-500/25 active:bg-blue-500/30',
  purple: 'bg-purple-500/20 dark:text-purple-300 text-purple-700 border border-purple-500/30 shadow-purple-500/10 hover:bg-purple-500/25 active:bg-purple-500/30',
}

// ─── Componente Formulario (Memoizado) ────────────────────────────────────

const FormularioTarea = memo(({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  color = 'blue',
  categoriasSugeridas,
}: {
  form: FormTarea
  onChange: (f: FormTarea) => void
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
            Nombre de la tarea *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={form.nombre}
            onChange={e => onChange({ ...form, nombre: e.target.value })}
            placeholder="Ej: Cambio de aceite"
            className="
              w-full min-h-[52px] px-4
              dark:bg-gray-800/50 bg-gray-200 border dark:border-gray-700/50 border-gray-300 rounded-2xl
              dark:text-white text-gray-900 placeholder-gray-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
              transition-all
            "
          />
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
            Tipo de servicio
          </label>
          <div className="relative">
            <select
              value={form.tipo}
              onChange={e => onChange({ ...form, tipo: e.target.value as TareaPredefinida['tipo'] })}
              className="
                w-full min-h-[52px] px-4 pr-10
                dark:bg-gray-800/50 bg-gray-200 border dark:border-gray-700/50 border-gray-300 rounded-2xl
                dark:text-white text-gray-900 text-sm appearance-none
                focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                transition-all
              "
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="ambos">Ambos</option>
            </select>
            <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
            Categoría
          </label>
          <input
            type="text"
            list="categorias-tareas-list"
            value={form.categoria}
            onChange={e => onChange({ ...form, categoria: e.target.value })}
            placeholder="Ej: Motor, Software, Hardware…"
            className="
              w-full min-h-[52px] px-4
              dark:bg-gray-800/50 bg-gray-200 border dark:border-gray-700/50 border-gray-300 rounded-2xl
              dark:text-white text-gray-900 placeholder-gray-600 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
              transition-all
            "
          />
          <datalist id="categorias-tareas-list">
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

FormularioTarea.displayName = 'FormularioTarea'

// ─── Componente Modal Principal ───────────────────────────────────────────

interface ModalTareaProps {
  isOpen: boolean
  onClose: () => void
  tarea: TareaPredefinida | null // Si está presente, es modo edición. Si es null, es creación.
  onSubmit: (data: FormTarea) => void
  categoriasSugeridas: string[]
}

export function ModalTarea({ isOpen, onClose, tarea, onSubmit, categoriasSugeridas }: ModalTareaProps) {
  const [form, setForm] = useState<FormTarea>(FORM_TAREA_VACIO)

  // Sincronizar estado cuando se abre o cambia el elemento seleccionado
  useEffect(() => {
    if (isOpen) {
      if (tarea) {
        setForm({
          nombre: tarea.nombre,
          tipo: tarea.tipo,
          categoria: tarea.categoria,
        })
      } else {
        setForm(FORM_TAREA_VACIO)
      }
    }
  }, [isOpen, tarea])

  // onChange estable
  const handleFormChange = useCallback((updatedForm: FormTarea) => {
    setForm(updatedForm)
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(form)
  }, [onSubmit, form])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tarea ? 'Editar tarea' : 'Nueva tarea'}
    >
      <FormularioTarea
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={tarea ? 'Guardar cambios' : 'Agregar tarea'}
        color="blue"
        categoriasSugeridas={categoriasSugeridas}
      />
    </Modal>
  )
}
