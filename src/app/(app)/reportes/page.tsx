'use client'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { BarChart3, Package, Calendar, Loader2 } from 'lucide-react'
import { useReporteConsumo, FiltroTiempo } from '@/hooks/useReporteConsumo'

export default function ReportesPage() {
  const [filtro, setFiltro] = useState<FiltroTiempo>('mes_actual');
  const { consumos, loading, error } = useReporteConsumo(filtro);

  const totalRepuestos = consumos.reduce((acc, curr) => acc + curr.cantidad, 0);
  const repuestoMasUsado = consumos.length > 0 ? consumos[0] : null;

  return (
    <div className="bg-transparent min-h-screen pb-safe">
      <div className="sticky top-0 z-40 dark:bg-gray-900/95 bg-gray-100/95 border-b dark:border-gray-800 border-gray-200 pt-safe backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 dark:bg-gray-900/80 bg-gray-100 ring-1 ring-inset ring-purple-500/20 rounded-xl shadow-[0_12px_40px_-24px_rgba(168,85,247,0.9)]">
                <BarChart3 className="w-6 h-6 dark:text-purple-400 text-purple-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold dark:text-white text-gray-900">Reportes</h1>
                <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Consumo de repuestos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filtro de tiempo */}
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
          {(['mes_actual', 'mes_pasado', 'ultimos_30', 'all'] as FiltroTiempo[]).map(f => {
            const labels = {
              mes_actual: 'Este Mes',
              mes_pasado: 'Mes Anterior',
              ultimos_30: 'Últimos 30 días',
              all: 'Histórico Completo'
            }
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtro === f 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                    : 'dark:bg-gray-800/50 bg-gray-200 dark:text-gray-400 text-gray-600 hover:dark:bg-gray-800 hover:bg-gray-200 border dark:border-gray-700/50 border-gray-300'
                }`}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl dark:text-red-400 text-red-700 text-sm">
            Hubo un error al cargar los reportes. Intenta de nuevo.
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="dark:bg-gray-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-400" />
                Total Repuestos Usados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white text-gray-900">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-600" /> : totalRepuestos}
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 dark:text-purple-400 text-purple-700" />
                Repuesto Más Usado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold dark:text-white text-gray-900 truncate">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-600" /> : (repuestoMasUsado?.pieza || 'Ninguno')}
              </div>
              {!loading && repuestoMasUsado && (
                <p className="text-xs text-gray-500 mt-1">{repuestoMasUsado.cantidad} unidades</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabla/Lista de Consumos */}
        <Card className="dark:bg-gray-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-lg overflow-hidden">
          <CardHeader className="border-b dark:border-white/10 border-gray-300/50 dark:bg-gray-900/30 bg-gray-100">
            <CardTitle className="dark:text-white text-gray-900 text-lg">Desglose de Consumo</CardTitle>
            <CardDescription className="dark:text-gray-400 text-gray-600">Cantidades usadas según el filtro seleccionado</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin dark:text-purple-500 text-purple-600" />
              </div>
            ) : consumos.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="dark:text-gray-400 text-gray-600 font-medium">No hay datos de consumo</h3>
                <p className="text-gray-500 text-sm mt-1">No se encontraron repuestos en este periodo.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {consumos.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:dark:bg-gray-800/30 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg dark:bg-gray-800 bg-gray-200 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 dark:text-gray-400 text-gray-600" />
                      </div>
                      <span className="dark:text-gray-200 text-gray-800 font-medium">{item.pieza}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="dark:text-white text-gray-900 font-bold text-lg">{item.cantidad}</span>
                      <span className="text-gray-500 text-xs font-medium uppercase">unidades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
