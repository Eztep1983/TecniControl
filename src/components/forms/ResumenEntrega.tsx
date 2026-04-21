import React from 'react'
import { FormStateEntrega } from '@/app/(app)/ordenes/entrega/formulario'

interface ResumenEntregaProps {
  state: FormStateEntrega
}

export default function ResumenEntrega({ state }: ResumenEntregaProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Resumen de Orden de Entrega</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Cliente y Dispositivo */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cliente</h3>
              <p className="font-medium text-gray-900">{state.clienteSeleccionado?.name}</p>
              <p className="text-sm text-gray-600 mt-1">{state.clienteSeleccionado?.email}</p>
              <p className="text-sm text-gray-600">{state.clienteSeleccionado?.phone}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Dispositivo</h3>
              <p className="font-medium text-gray-900">{state.dispositivoSeleccionado?.tipo} {state.dispositivoSeleccionado?.marca}</p>
              <p className="text-sm text-gray-600 mt-1">Modelo: {state.dispositivoSeleccionado?.modelo}</p>
              <p className="text-sm text-gray-600">S/N: {state.dispositivoSeleccionado?.numeroSerie}</p>
            </div>
          </div>

          {/* Detalles de Entrega */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalles de Entrega</h3>
            <div className="space-y-3">
              {state.reparacionesRealizadas && (
                <div>
                  <span className="block text-sm font-medium text-gray-700">Reparaciones:</span>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{state.reparacionesRealizadas}</p>
                </div>
              )}
              {state.repuestosUtilizados && (
                <div>
                  <span className="block text-sm font-medium text-gray-700">Repuestos:</span>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{state.repuestosUtilizados}</p>
                </div>
              )}
              <div>
                <span className="block text-sm font-medium text-gray-700">Observaciones Finales:</span>
                <p className="text-sm text-gray-600 whitespace-pre-line">{state.observacionesFinales}</p>
              </div>
            </div>
          </div>

          {/* Validación */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-1">Validación del Cliente</h3>
              <p className="text-sm text-blue-800">
                Firmado por: <span className="font-medium">{state.nombreFirmante}</span>
              </p>
              {state.validacionCliente && (
                <p className="text-xs text-blue-600 mt-1">✓ Cliente aceptó términos y condiciones</p>
              )}
            </div>
            {state.firmaCliente && (
              <div className="bg-white p-2 rounded border border-gray-200">
                <img src={state.firmaCliente} alt="Firma del cliente" className="h-16 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
