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

// Componente de skeleton para loading
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} className="animate-pulse">
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted"></div>
              <div className="space-y-1">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-3 w-20 bg-muted rounded"></div>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 w-40 bg-muted rounded"></div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 w-24 bg-muted rounded"></div>
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ClientesDataTable({ data }: ClientesDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Resetear a la primera página al buscar
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClientes = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    return data.filter((cliente) => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        cliente.name?.toLowerCase().includes(searchLower) ||
        cliente.email?.toLowerCase().includes(searchLower) ||
        cliente.phone?.toLowerCase().includes(searchLower) ||
        cliente.cedula?.toLowerCase().includes(searchLower) ||
        cliente.address?.toLowerCase().includes(searchLower) 
      );
    });
  }, [data, debouncedSearchTerm]);

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  // Asegurarse de que la página actual esté dentro del rango válido
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Obtener los clientes para la página actual
  const paginatedClientes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClientes.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredClientes, itemsPerPage]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
        <Button
          key={i}
          variant={currentPage === i ? "default" : "ghost"}
          className="h-8 w-8 p-0 hidden sm:flex"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="space-y-4">
      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este cliente permanentemente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto"
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
      
      <br />
      {/* Tarjeta con el total de clientes */}
      <div className="bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg md:p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 text-white">Total de Clientes Registrados</h2>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{data.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {debouncedSearchTerm ? `${filteredClientes.length} coinciden con tu búsqueda` : 'Gestión completa de clientes'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Barra de búsqueda y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg  md:p-6">
        <div className="relative w-full sm:max-w-sm lg:max-w-lg shadow-lg ">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar clientes..."
            className="pl-8 w-full bg-transparent"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Mostrar
          </span>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm dark:bg-gray-800"
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
          <span className="text-sm text-muted-foreground">
            por página
          </span>
        </div>
      </div>
      
      {/* Información de resultados */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-2 ">
        <p className="text-sm text-muted-foreground">
          {filteredClientes.length === 0 
            ? "No se encontraron clientes" 
            : `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredClientes.length)} de ${filteredClientes.length} cliente${filteredClientes.length !== 1 ? 's' : ''}`
          }
        </p>
        
        {debouncedSearchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="h-8 px-2 lg:px-3 self-end sm:self-auto"
          >
            Limpiar búsqueda
            <span className="sr-only">Limpiar búsqueda</span>
          </Button>
        )}
      </div>

      {/* Tabla responsive */}
      <div className="rounded-md bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Nombre</TableHead>
              <TableHead className="w-[25%] hidden md:table-cell">Email</TableHead>
              <TableHead className="w-[15%]">Teléfono</TableHead>
              <TableHead className="w-[30%] hidden sm:table-cell">Dirección</TableHead>
              <TableHead className="w-[10%] text-right">
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
                    className={`cursor-pointer transition-all duration-200 ${isLoading ? "opacity-70 pointer-events-none" : "hover:bg-muted/50"}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isViewing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-muted-foreground">{client.cedula}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{client.address || "-"}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {/* Botones de acción visibles en pantallas grandes */}
                        <div className="hidden md:flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleEditClick(client.id!, e)}
                            title="Editar cliente"
                            disabled={!!isLoading}
                            className="h-8 w-8"
                          >
                            {isEditing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRowClick(client.id!)}
                            title="Ver detalles"
                            disabled={!!isLoading}
                            className="h-8 w-8"
                          >
                            {isViewing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDeleteClick(client.id!, e)}
                            title="Eliminar cliente"
                            disabled={!!isLoading}
                            className="h-8 w-8"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Menú desplegable para pantallas pequeñas */}
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={!!isLoading}>
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              
                              <DropdownMenuItem 
                                onClick={(e) => handleEditClick(client.id!, e)}
                                className="cursor-pointer"
                                disabled={!!isLoading}
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
                                className="cursor-pointer"
                                disabled={!!isLoading}
                              >
                                {isViewing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="mr-2 h-4 w-4" />
                                )}
                                Ver detalles
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                className="text-destructive cursor-pointer focus:text-destructive"
                                onClick={(e) => handleDeleteClick(client.id!, e)}
                                disabled={!!isLoading}
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
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {debouncedSearchTerm ? 
                    "No se encontraron clientes que coincidan con tu búsqueda." : 
                    "No hay clientes registrados."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4 sm:gap-0">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Ir a la primera página</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Ir a la página anterior</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Números de página - versión responsive */}
              <div className="flex items-center gap-1">
                {renderPaginationButtons()}
                
                {/* Indicador de más páginas en móvil */}
                {totalPages > 5 && (
                  <span className="text-sm text-muted-foreground px-1 sm:hidden">
                    {currentPage} / {totalPages}
                  </span>
                )}
              </div>
              
              <Button
                className="h-8 w-8 p-0"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Ir a la página siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8 p-0 hidden sm:flex"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Ir a la última página</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}