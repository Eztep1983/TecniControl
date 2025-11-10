"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/basic/table";
import { Button } from "@/components/ui/basic/button";
import { Input } from "@/components/ui/basic/input";
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
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  X,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

interface ClientesDataTableProps {
  data: Cliente[];
}

export function ClientesDataTable({ data }: ClientesDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleRowClick = async (id: string) => {
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
      
      {/* Estadísticas - Mobile first */}
      <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-400 truncate">Total de Clientes</h3>
            <p className="text-2xl font-bold text-white">{data.length}</p>
          </div>
        </div>
      </div>
      
      {/* Controles - Mobile first */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between">
        <div className="text-xs sm:text-sm text-gray-400">
          {data.length === 0 
            ? "No hay clientes registrados" 
            : `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, data.length)} de ${data.length}`
          }
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-gray-500">Mostrar</span>
          <select
            className="h-8 rounded-lg border border-gray-700 bg-gray-800/50 px-2 text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Tabla responsive - Mobile first */}
      <div className="bg-gray-800/40 rounded-lg border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-gray-700/50 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium h-10 px-3 text-xs sm:text-sm">Nombre</TableHead>
                <TableHead className="text-gray-400 font-medium h-10 px-3 text-xs sm:text-sm hidden md:table-cell">Email</TableHead>
                <TableHead className="text-gray-400 font-medium h-10 px-3 text-xs sm:text-sm">Teléfono</TableHead>
                <TableHead className="text-gray-400 font-medium h-10 px-3 text-xs sm:text-sm hidden sm:table-cell">Dirección</TableHead>
                <TableHead className="text-gray-400 font-medium h-10 px-3 text-xs sm:text-sm text-right w-[80px]">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClientes.length > 0 ? (
                paginatedClientes.map((client) => {
                  const isLoading = loadingStates[client.id!];
                  const isDeleting = isLoading === "deleting";
                  const isViewing = isLoading === "viewing";
                  const isEditing = isLoading === "editing";
                  
                  return (
                    <TableRow 
                      key={client.id}
                      onClick={() => !isLoading && handleRowClick(client.id!)}
                      className={`border-gray-700/50 transition-colors ${
                        isLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "cursor-pointer hover:bg-gray-700/30 active:bg-gray-700/50"
                      }`}
                    >
                      <TableCell className="px-3 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                          {isViewing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                          ) : (
                            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm truncate">{client.name}</div>
                            <div className="text-xs text-gray-500 truncate">{client.cedula}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-3 py-2 sm:py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300 truncate">{client.email}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-3 py-2 sm:py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300 truncate">{client.phone}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-3 py-2 sm:py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-300 truncate">{client.address || "-"}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-3 py-2 sm:py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {/* Botones de acción visibles en desktop */}
                          <div className="hidden md:flex gap-1">
                            <button
                              onClick={(e) => handleEditClick(client.id!, e)}
                              disabled={!!isLoading}
                              className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Editar"
                            >
                              {isEditing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              ) : (
                                <Edit className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleRowClick(client.id!)}
                              disabled={!!isLoading}
                              className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Ver"
                            >
                              {isViewing ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            
                            <button
                              onClick={(e) => handleDeleteClick(client.id!, e)}
                              disabled={!!isLoading}
                              className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50 group"
                              title="Eliminar"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                              )}
                            </button>
                          </div>
                          
                          {/* Menú desplegable para móvil */}
                          <div className="md:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  disabled={!!isLoading}
                                  className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                  ) : (
                                    <>
                                      <span className="sr-only">Abrir menú</span>
                                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                    </>
                                  )}
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
                                  onClick={() => handleRowClick(client.id!)}
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
                                  {isDeleting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                  )}
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="border-gray-700/50">
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-gray-400">
                    No hay clientes registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Paginación - Mobile first */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Números de página */}
            {renderPaginationButtons()}
            
            {/* Indicador móvil */}
            <div className="sm:hidden flex items-center justify-center px-2 text-xs text-gray-400">
              {currentPage} / {totalPages}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}