"use client";

import * as React from "react";
import { Button } from "@/components/ui/basic/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/basic/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  IdCard,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";

interface ClientesDataTableProps {
  data: Cliente[];
}

export function ClientesDataTable({ data }: ClientesDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calcular el total de páginas
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Asegurarse de que la página actual esté dentro del rango válido
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Obtener los clientes para la página actual
  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteDoc(doc(db, "clientes", clienteToDelete));
      
      toast({
        title: "✅ Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente.",
        variant: "default", 
      });

      // Si eliminamos el último elemento de la página, retroceder una página
      if (paginatedClientes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      router.refresh();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el cliente. " + 
                    (error instanceof Error ? error.message : "Intente nuevamente más tarde."),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  const handleNavigation = async (path: string, id: string, action: string) => {
    setLoadingStates(prev => ({ ...prev, [id]: action }));
    
    // Pequeña demora para que se vea el feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
    
    router.push(path);
  };

  const handleCardClick = async (id: string) => {
    await handleNavigation(`/clientes/${id}`, id, "viewing");
  };

  const handleEditClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await handleNavigation(`/clientes/${id}/editar`, id, "editing");
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Función para generar los botones de paginación
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all ${
            currentPage === i
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="space-y-3">
      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar cliente?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este cliente permanentemente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Estadísticas */}
      <div className="bg-gradient-to-br from-blue-300/10 to-blue-800/10 rounded-xl border border-blue-500/20 p-2 sm:p-6">
        <div className="flex items-center gap-4">
          <div>
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-medium text-gray-400 truncate">Total de Clientes</h3>
            <p className="text-3xl sm:text-4xl font-bold text-white">{data.length}</p>
          </div>
        </div>
      </div>
      
      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-gray-400">
          {data.length === 0 
            ? "No hay clientes registrados" 
            : `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, data.length)} de ${data.length}`
          }
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-gray-500">Mostrar</span>
          <select
            className="h-9 rounded-lg border border-gray-700 bg-gray-800/50 px-3 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards */}
      {paginatedClientes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedClientes.map((client) => {
            const isLoading = loadingStates[client.id!];
            const isViewing = isLoading === "viewing";
            const isEditing = isLoading === "editing";
            
            return (
              <div
                key={client.id}
                onClick={() => !isLoading && handleCardClick(client.id!)}
                className={`group relative bg-gray-800/40 rounded-xl border border-gray-700/50 p-5 transition-all duration-200 ${
                  isLoading 
                    ? "opacity-50 cursor-not-allowed" 
                    : "cursor-pointer hover:bg-gray-800/60 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]"
                }`}
              >
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      <span className="text-xs text-gray-400">
                        {isViewing ? "Cargando..." : "Abriendo editor..."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Header del Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-blue-400 transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <IdCard className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{client.cedula}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={!!isLoading}
                        className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      >
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                      <DropdownMenuLabel className="text-gray-400">Acciones</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        onClick={(e) => handleEditClick(client.id!, e)}
                        disabled={!!isLoading}
                        className="text-gray-300 focus:bg-gray-700 focus:text-white cursor-pointer"
                      >
                        {isEditing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="mr-2 h-4 w-4" />
                        )}
                        Editar
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => handleCardClick(client.id!)}
                        disabled={!!isLoading}
                        className="text-gray-300 focus:bg-gray-700 focus:text-white cursor-pointer"
                      >
                        {isViewing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="mr-2 h-4 w-4" />
                        )}
                        Ver detalles
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteClick(client.id!, e)}
                        disabled={!!isLoading}
                        className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información de contacto */}
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gray-700/30 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-300 truncate">{client.email}</p>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gray-700/30 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-sm text-gray-300 truncate">{client.phone}</p>
                    </div>
                  </div>

                  {/* Dirección */}
                  {client.address && (
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gray-700/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Dirección</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{client.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer con botones de acción (visible en hover en desktop) */}
                <div className="hidden sm:flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditClick(client.id!, e)}
                    disabled={!!isLoading}
                    className="flex-1 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm text-gray-300"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteClick(client.id!, e)}
                    disabled={!!isLoading}
                    className="flex-1 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No hay clientes registrados</h3>
          <p className="text-sm text-gray-500">Comienza agregando tu primer cliente</p>
        </div>
      )}
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Números de página */}
            {renderPaginationButtons()}
            
            {/* Indicador móvil */}
            <div className="sm:hidden flex items-center justify-center px-3 text-xs font-medium text-gray-400 bg-gray-700/30 rounded-lg h-9">
              {currentPage} / {totalPages}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}