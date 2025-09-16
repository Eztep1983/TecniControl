"use client";
import { useState, useEffect } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Settings
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Acceso Requerido</h2>
            <p className="text-gray-400">Debes iniciar sesión para gestionar los clientes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
          </div>
          <p className="text-gray-400 mt-4 font-medium">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-8 border border-red-700/50 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error al Cargar</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Gestión de Clientes
                </h1>
                <p className="text-gray-400 text-sm">
                  {filteredClientes.length} de {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg  transition-all duration-200 shadow-lg"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                asChild 
                className="bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg  transition-all duration-200 shadow-lg"
              >
                <Link href="/clientes/nuevo">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Controles de búsqueda y filtros */}
        
        {/* Contenido principal */}
        {filteredClientes.length === 0 && clientes.length === 0 ? (
          <div className="bg-gradient-to-r from-blue-20 to-indigo-10 border-black p-3 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20 text-center shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">¡Comienza tu gestión!</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              No tienes clientes registrados aún. Agrega tu primer cliente para comenzar a gestionar dispositivos y órdenes de mantenimiento.
            </p>
            <Button 
              asChild 
              size="lg"
              className="bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 border-black rounded-lg text-xm font-semibold shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Link href="/clientes/nuevo">
                <PlusCircle className="mr-2 h-5 w-5" />
                Crear Primer Cliente
              </Link>
            </Button>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 text-center">
            <Filter className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500">Intenta ajustar tus criterios de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
            <ClientesDataTable data={filteredClientes} />
          </div>
        )}
      </div>
    </div>
  );
}