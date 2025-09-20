// components/forms/DispositivoSelector.tsx
'use client'
import { Cliente, Dispositivo } from '@/types/orden'
import { Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DispositivoSelectorProps {
  cliente: Cliente
  dispositivoSeleccionado: Dispositivo | null
  onSeleccionarDispositivo: (dispositivo: Dispositivo) => void
  onDesseleccionarDispositivo: () => void
}

export default function DispositivoSelector({
  cliente,
  dispositivoSeleccionado,
  onSeleccionarDispositivo,
  onDesseleccionarDispositivo
}: DispositivoSelectorProps) {
  const router = useRouter()

  if (dispositivoSeleccionado) {
    return (
      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-green-300">{dispositivoSeleccionado.tipo}</h3>
            <p className="text-sm text-green-400/80 mt-1">{dispositivoSeleccionado.marca} {dispositivoSeleccionado.modelo}</p>
            <p className="text-sm text-green-400/70 mt-1">S/N: {dispositivoSeleccionado.numeroSerie}</p>
          </div>
          <button
            type="button"
            onClick={onDesseleccionarDispositivo}
            className="text-green-400 hover:text-green-300 text-sm transition-colors px-3 py-1 rounded hover:bg-green-500/20 ml-4"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cliente.dispositivos && cliente.dispositivos.length > 0 ? (
        cliente.dispositivos.map((dispositivo) => (
          <div
            key={dispositivo.id}
            onClick={() => onSeleccionarDispositivo(dispositivo)}
            className="p-4 border border-gray-700 rounded-lg hover:bg-gray-700/50 cursor-pointer hover:border-green-500 transition-all duration-200 hover:shadow-lg group"
          >
            <div className="font-medium text-white group-hover:text-green-300 transition-colors">{dispositivo.tipo}</div>
            <div className="text-sm text-gray-300">{dispositivo.marca} {dispositivo.modelo}</div>
            <div className="text-xs text-gray-500 mt-1">S/N: {dispositivo.numeroSerie}</div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">Este cliente no tiene dispositivos registrados</p>
          <button
            type="button"
            onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
            className="mt-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Agregar dispositivos al cliente
          </button>
        </div>
      )}
    </div>
  )
}