"use client";
import { useState, useEffect } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { Button } from "@/components/ui/basic/button";
import { Input } from "@/components/ui/basic/input";
import Link from "next/link";
import { 
  PlusCircle, 
  User, 
  Loader2, 
  Search, 
  Users, 
  Filter,
  RefreshCw,
  Download,
  Settings,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { Cliente } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";

// IMPORTAR LOS HELPERS MULTI-USUARIO
import { getClientesPorUsuario } from '@/lib/multiuser-helpers'

export function ClientesList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const { user } = useAuth();

  useEffect(() => {
    const fetchClientes = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const clientesData = await getClientesPorUsuario(user.uid);
        setClientes(clientesData);
        setFilteredClientes(clientesData);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
        setError("No se pudieron cargar los clientes. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [user?.uid]);

  // Función para refrescar datos
  const handleRefresh = async () => {
    if (!user?.uid || loading) return;
    
    try {
      setRefreshing(true);
      const clientesData = await getClientesPorUsuario(user.uid);
      setClientes(clientesData);
      setFilteredClientes(clientesData);
    } catch (error) {
      console.error("Error al refrescar clientes:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrar clientes por búsqueda y estado
  useEffect(() => {
    let filtered = clientes;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cliente =>
        cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.phone?.includes(searchTerm)
      );
    }
    setFilteredClientes(filtered);
  }, [clientes, searchTerm, filter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-6">
            <div className="w-16 h-16 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 text-center">Acceso Requerido</h2>
            <p className="text-sm text-gray-400 text-center">Debes iniciar sesión para gestionar los clientes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/40 rounded-xl border border-red-500/40 p-6">
            <div className="w-16 h-16 bg-red-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 text-center">Error al Cargar</h2>
            <p className="text-sm text-gray-400 mb-6 text-center">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Contenedor principal - Mobile first con padding mínimo */}
      <div className="w-full p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
          {/* Header - Optimizado para móvil */}
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-700/50 bg-gray-800/60">
            <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              {/* Título y contador */}
              <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white truncate">Gestión de Clientes</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {filteredClientes.length} de {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
                  </p>
                </div>
              </div>
              
              {/* Botones de acción - Stack en móvil, inline en desktop */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-gray-300 hidden xs:inline">Actualizar</span>
                </button>
                
                <Link href="/clientes/nuevo" className="flex-1 sm:flex-initial">
                  <button
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-all text-sm"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">Nuevo Cliente</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda - Ajustada para móvil */}
          <div className="px-4 py-3 sm:px-5 border-b border-gray-700/50 bg-gray-800/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Contenido principal - Mobile first */}
          <div className="p-4 sm:p-5">
            {filteredClientes.length === 0 && clientes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 px-4">¡Comienza tu gestión!</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto px-4">
                  No tienes clientes registrados aún. Agrega tu primer cliente para comenzar a gestionar dispositivos y órdenes de mantenimiento.
                </p>
                <Link href="/clientes/nuevo">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg text-blue-400 font-medium transition-all active:scale-95">
                    <PlusCircle className="w-5 h-5" />
                    <span>Crear Primer Cliente</span>
                  </button>
                </Link>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-base font-medium text-gray-300 mb-2">No se encontraron resultados</h3>
                <p className="text-sm text-gray-500 px-4">Intenta ajustar tus criterios de búsqueda.</p>
              </div>
            ) : (
              <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <ClientesDataTable data={filteredClientes} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}