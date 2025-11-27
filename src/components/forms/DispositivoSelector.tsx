// components/forms/DispositivoSelector.tsx
'use client'
import { Cliente, Dispositivo } from '@/types/orden'
import { Monitor, Laptop, Smartphone, Tablet, HardDrive, ChevronLeft, ChevronRight, Cpu, Package, AlertCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DispositivoSelectorProps {
  cliente: Cliente
  dispositivoSeleccionado: Dispositivo | null
  onSeleccionarDispositivo: (dispositivo: Dispositivo) => void
  onDesseleccionarDispositivo: () => void
}

const ITEMS_PER_PAGE = 6

const getIconoDispositivo = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  if (tipoLower.includes('laptop') || tipoLower.includes('portátil')) {
    return Laptop
  }
  if (tipoLower.includes('celular') || tipoLower.includes('móvil') || tipoLower.includes('smartphone')) {
    return Smartphone
  }
  if (tipoLower.includes('tablet')) {
    return Tablet
  }
  if (tipoLower.includes('disco') || tipoLower.includes('hdd') || tipoLower.includes('ssd')) {
    return HardDrive
  }
  return Monitor
}

export default function DispositivoSelector({
  cliente,
  dispositivoSeleccionado,
  onSeleccionarDispositivo,
  onDesseleccionarDispositivo
}: DispositivoSelectorProps) {
  const router = useRouter()
  const [paginaActual, setPaginaActual] = useState(1)
  const [dispositivoAnimando, setDispositivoAnimando] = useState<string | null>(null)

  // Validación: asegurar que dispositivos es un array
  const dispositivos = Array.isArray(cliente.dispositivos) ? cliente.dispositivos : []

  // Cálculos de paginación
  const totalPaginas = Math.ceil(dispositivos.length / ITEMS_PER_PAGE)
  const indiceInicio = (paginaActual - 1) * ITEMS_PER_PAGE
  const indiceFin = indiceInicio + ITEMS_PER_PAGE
  const dispositivosPaginados = dispositivos.slice(indiceInicio, indiceFin)

  const handleSeleccionarDispositivo = (dispositivo: Dispositivo) => {
    setDispositivoAnimando(dispositivo.id)
    setTimeout(() => {
      onSeleccionarDispositivo(dispositivo)
      setDispositivoAnimando(null)
    }, 300)
  }

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(prev => prev + 1)
    }
  }

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(prev => prev - 1)
    }
  }

  if (dispositivoSeleccionado) {
    const IconoDispositivo = getIconoDispositivo(dispositivoSeleccionado.tipo)
    
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500/15 to-green-600/10 p-5 rounded-xl border border-green-500/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center animate-in zoom-in duration-200">
                <IconoDispositivo className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-green-200 text-lg">{dispositivoSeleccionado.tipo}</h3>
                <p className="text-xs text-green-400/60">Dispositivo seleccionado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-14">
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="w-4 h-4 text-green-400/70" />
                <span className="text-green-300/90">{dispositivoSeleccionado.marca} {dispositivoSeleccionado.modelo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-green-400/70" />
                <span className="text-green-300/90 font-mono text-xs">S/N: {dispositivoSeleccionado.numeroSerie}</span>
              </div>
            </div>

            {dispositivoSeleccionado.estado && (
              <div className="flex items-center gap-2 pl-14">
                <div className="px-3 py-1.5 bg-green-500/20 rounded-full">
                  <span className="text-xs text-green-300 font-medium">
                    Estado: {dispositivoSeleccionado.estado}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDesseleccionarDispositivo}
            className="flex-shrink-0 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  if (dispositivos.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-700/50 rounded-xl bg-gray-800/50 animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium mb-2">Este cliente no tiene dispositivos registrados</p>
        <p className="text-sm text-gray-500 mb-4">Agrega dispositivos para poder crear órdenes de servicio</p>
        <button
          type="button"
          onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agregar dispositivos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl text-gray-300 font-medium">Seleccionar Dispositivo</p>
          <p className="text-xs text-gray-500">Elige el dispositivo para esta orden de servicio</p>
        </div>
        {dispositivos.length > 0 && (
          <div className="px-3 py-1.5 bg-gray-700/50 rounded-full">
            <span className="text-xs text-gray-400 font-medium">
              {dispositivos.length} dispositivo{dispositivos.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dispositivosPaginados.map((dispositivo, index) => {
          const IconoDispositivo = getIconoDispositivo(dispositivo.tipo)
          
          return (
            <div
              key={dispositivo.id}
              onClick={() => handleSeleccionarDispositivo(dispositivo)}
              className={`p-4 border border-gray-700/50 rounded-xl hover:bg-gray-700/40 cursor-pointer hover:border-green-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 group active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 ${
                dispositivoAnimando === dispositivo.id ? 'bg-green-500/20 scale-[0.96] border-green-500/70' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-700/50 group-hover:bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110">
                  <IconoDispositivo className="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-green-300 transition-colors mb-1">
                    {dispositivo.tipo}
                  </div>
                  <div className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                    {dispositivo.marca} {dispositivo.modelo}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Package className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500 font-mono">
                      {dispositivo.numeroSerie}
                    </span>
                  </div>
                  {dispositivo.estado && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-700/50 group-hover:bg-green-500/20 rounded-full text-xs text-gray-400 group-hover:text-green-300 transition-colors">
                        {dispositivo.estado}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePaginaAnterior}
            disabled={paginaActual === 1}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all text-sm text-gray-300 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Página {paginaActual} de {totalPaginas}
            </span>
          </div>
          
          <button
            onClick={handlePaginaSiguiente}
            disabled={paginaActual === totalPaginas}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all text-sm text-gray-300 active:scale-95"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}