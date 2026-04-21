import React from 'react'

interface EvidenciaEntregaProps {
  observacionesFinales: string
  setObservacionesFinales: (obs: string) => void
  reparacionesRealizadas: string
  setReparacionesRealizadas: (rep: string) => void
  repuestosUtilizados: string
  setRepuestosUtilizados: (rep: string) => void
}

export default function EvidenciaEntrega({
  observacionesFinales,
  setObservacionesFinales,
  reparacionesRealizadas,
  setReparacionesRealizadas,
  repuestosUtilizados,
  setRepuestosUtilizados
}: EvidenciaEntregaProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Evidencia y Detalles de Entrega</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trabajo / Reparaciones Realizadas
            </label>
            <textarea
              value={reparacionesRealizadas}
              onChange={(e) => setReparacionesRealizadas(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Describa el trabajo o reparaciones efectuadas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repuestos Utilizados
            </label>
            <textarea
              value={repuestosUtilizados}
              onChange={(e) => setRepuestosUtilizados(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Detalle los repuestos que se cambiaron (si aplica)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Finales y Estado del Equipo *
            </label>
            <textarea
              value={observacionesFinales}
              onChange={(e) => setObservacionesFinales(e.target.value)}
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Indique el estado en que se entrega el equipo, pruebas realizadas y observaciones para el cliente..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
