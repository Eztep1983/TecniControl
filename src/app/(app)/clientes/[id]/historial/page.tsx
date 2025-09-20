"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/basic/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card";
import { Badge } from "@/components/ui/basic/badge";
import { Input } from "@/components/ui/basic/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/basic/select";
import Link from "next/link";
import { Cliente, Orden } from "@/types/orden";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Filter,
  Search,
  User,
  Monitor,
  CheckCircle,
  AlertCircle,
  Wrench,
  Package,
  Stethoscope,
  BarChart3,
  Download,
  Printer
} from "lucide-react";

interface ClienteHistorialPageProps {
  params: Promise<{ id: string }>;
}

// Función para obtener el cliente y sus órdenes
async function getClienteAndOrders(id: string) {
  try {
    // Obtener información del cliente
    const clienteDoc = await getDoc(doc(db, "clientes", id));
    if (!clienteDoc.exists()) {
      return { cliente: null, orders: [] };
    }

    const clienteData = clienteDoc.data();
    const cliente = {
      id: clienteDoc.id,
      name: clienteData.name || clienteData.nombre || '',
      cedula: clienteData.cedula || '',
      email: clienteData.email || '',
      phone: clienteData.phone || clienteData.telefono || '',
      address: clienteData.address || clienteData.direccion || '',
      dispositivos: clienteData.dispositivos || [],
      createdAt: clienteData.createdAt,
      updatedAt: clienteData.updatedAt,
    } as Cliente;

    // Obtener órdenes del cliente
    const ordersQuery = query(
      collection(db, "ordenes"),
      where("cliente.id", "==", id),
      orderBy("fechaCreacion", "desc")
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Orden[] = [];
    
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate(),
        fechaEntrega: data.fechaEntrega?.toDate(),
        fechaCompra: data.fechaCompra?.toDate(),
      } as unknown as Orden);
    });

    return { cliente, orders };
  } catch (error) {
    console.error("Error fetching cliente and orders:", error);
    return { cliente: null, orders: [] };
  }
}

// Componente para mostrar el badge del tipo de orden
const OrderTypeBadge = ({ type }: { type: string }) => {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'garantia': return 'destructive';
      case 'mantenimiento': return 'default';
      case 'diagnostico': return 'secondary';
      case 'entrega': return 'outline';
      default: return 'secondary';
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'garantia': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'mantenimiento': return <Wrench className="w-3 h-3 mr-1" />;
      case 'diagnostico': return <Stethoscope className="w-3 h-3 mr-1" />;
      case 'entrega': return <Package className="w-3 h-3 mr-1" />;
      default: return <FileText className="w-3 h-3 mr-1" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'garantia': return 'Garantía';
      case 'mantenimiento': return 'Mantenimiento';
      case 'diagnostico': return 'Diagnóstico';
      case 'entrega': return 'Entrega';
      default: return type;
    }
  };

  return (
    <Badge variant={getBadgeVariant(type)} className="flex items-center">
      {getBadgeIcon(type)}
      {getTypeLabel(type)}
    </Badge>
  );
};

// Componente para mostrar una tarjeta de orden
const OrderCard = ({ order }: { order: Orden }) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Orden #{order.id ? order.id.slice(-6).toUpperCase() : 'N/A'}
              <OrderTypeBadge type={order.tipo} />
            </CardTitle>
            <CardDescription>
              {formatDate(order.fechaCreacion)}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ordenes/${order.id}`}>
              Ver detalles
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Monitor className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Dispositivo:</span>
              <span className="ml-1 capitalize">{order.dispositivo.tipo}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Marca/Modelo:</span>
              <span className="ml-1">{order.dispositivo.marca} {order.dispositivo.modelo}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Serie:</span>
              <span className="ml-1 font-mono text-xs">{order.dispositivo.numeroSerie}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {order.tipo === 'mantenimiento' && (
              <div className="flex items-center text-sm">
                <Wrench className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="capitalize">{order.tipoMantenimiento}</span>
              </div>
            )}
            
            {order.tipo === 'garantia' && order.fechaCompra && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Compra: {formatDate(order.fechaCompra)}</span>
              </div>
            )}
            
            {order.tipo === 'entrega' && order.fechaEntrega && (
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Entregado: {formatDate(order.fechaEntrega)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Información adicional específica por tipo */}
        <div className="mt-4 pt-4 border-t">
          {order.tipo === 'diagnostico' && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {order.observacionesIniciales}
            </p>
          )}
          
          {order.tipo === 'garantia' && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {order.descripcionProblema}
            </p>
          )}
          
          {order.tipo === 'mantenimiento' && order.tareasRealizadas && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              Tareas: {order.tareasRealizadas.join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ClienteHistorialPage({ params }: ClienteHistorialPageProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [orders, setOrders] = useState<Orden[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  // Resolver los parámetros de la URL
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setResolvedParams(resolved);
      } catch (error) {
        console.error("Error resolving params:", error);
      }
    };

    resolveParams();
  }, [params]);

  // Cargar datos cuando los parámetros estén resueltos
  useEffect(() => {
    const fetchData = async () => {
      if (!resolvedParams) return;
      
      setLoading(true);
      const { cliente, orders } = await getClienteAndOrders(resolvedParams.id);
      setCliente(cliente);
      setOrders(orders);
      setFilteredOrders(orders);
      setLoading(false);
    };

    fetchData();
  }, [resolvedParams]);

  // Aplicar filtros
  useEffect(() => {
    let result = orders;

    // Filtrar por tipo
    if (orderTypeFilter !== "all") {
      result = result.filter(order => order.tipo === orderTypeFilter);
    }

    // Filtrar por fecha
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(order => 
        order.fechaCreacion && new Date(order.fechaCreacion) >= filterDate
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.dispositivo.tipo.toLowerCase().includes(term) ||
        order.dispositivo.marca.toLowerCase().includes(term) ||
        order.dispositivo.modelo.toLowerCase().includes(term) ||
        order.dispositivo.numeroSerie.toLowerCase().includes(term) ||
        (order.tipo === 'diagnostico' && order.observacionesIniciales.toLowerCase().includes(term)) ||
        (order.tipo === 'garantia' && order.descripcionProblema.toLowerCase().includes(term))
      );
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, orderTypeFilter, dateFilter]);

  // Estadísticas
  const stats = {
    total: orders.length,
    garantia: orders.filter(o => o.tipo === 'garantia').length,
    mantenimiento: orders.filter(o => o.tipo === 'mantenimiento').length,
    diagnostico: orders.filter(o => o.tipo === 'diagnostico').length,
    entrega: orders.filter(o => o.tipo === 'entrega').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm max-w-md w-full mx-auto">
          <div className="mb-4">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h2>
          <p className="text-gray-600 mb-6">El cliente que buscas no existe o ha sido eliminado.</p>
          <Button asChild>
            <Link href="/clientes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link href={`/clientes/${resolvedParams?.id}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <User className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
                Historial de {cliente.name}
              </h1>
            </div>
            <p className="text-gray-600">Todas las órdenes y servicios realizados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel lateral con estadísticas */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-black-700">{stats.total}</div>
                    <div className="text-xs text-black-600">Total Órdenes</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats.garantia}</div>
                    <div className="text-xs text-blue-600">Garantías</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.mantenimiento}</div>
                    <div className="text-xs text-green-600">Mantenimientos</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">{stats.diagnostico}</div>
                    <div className="text-xs text-purple-600">Diagnósticos</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cédula:</span>
                      <span>{cliente.cedula || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span>{cliente.phone || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="truncate max-w-[120px]">{cliente.email || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dispositivos:</span>
                      <span>{cliente.dispositivos?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* Filtros y búsqueda */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar en órdenes..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="garantia">Garantía</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                        <SelectItem value="entrega">Entrega</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todo el tiempo</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mes</SelectItem>
                        <SelectItem value="3months">Últimos 3 meses</SelectItem>
                        <SelectItem value="year">Último año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'} encontrada{filteredOrders.length === 1 ? '' : 's'}
                </h2>
                
                {filteredOrders.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Mostrando {Math.min(filteredOrders.length, 10)} de {filteredOrders.length}
                  </div>
                )}
              </div>

              {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron órdenes</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {orders.length === 0 
                        ? "Este cliente no tiene órdenes registradas."
                        : "No hay órdenes que coincidan con los filtros aplicados."
                      }
                    </p>
                    <Button asChild>
                      <Link href={`/ordenes/nueva?clienteId=${resolvedParams?.id}`}>
                        Crear primera orden
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}