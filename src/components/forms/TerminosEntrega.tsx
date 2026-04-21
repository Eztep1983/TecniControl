import React from 'react'
import { ShieldCheck, UserCheck } from 'lucide-react'

export default function TerminosEntrega() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          Derechos y Responsabilidades
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Del Comprador / Cliente */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
              Del Comprador (Cliente)
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Revisar el equipo al momento de la entrega para asegurar que cumple con lo acordado.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Hacer uso adecuado del equipo siguiendo las recomendaciones dadas.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Conservar esta orden de entrega como comprobante para cualquier reclamo de garantía.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Reportar cualquier fallo cubierto por la garantía dentro de los tiempos estipulados.
              </li>
            </ul>
          </div>

          {/* Del Vendedor / Técnico */}
          <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-purple-600" />
              Del Vendedor (Técnico)
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Entregar el equipo en óptimas condiciones de funcionamiento según el trabajo cotizado.
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Brindar garantía sobre las piezas cambiadas y la mano de obra realizada.
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                No se hace responsable por daños causados por mal uso, variaciones de voltaje o intervención de terceros.
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Atender de manera oportuna los llamados por garantía justificada.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
