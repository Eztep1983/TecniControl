"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/basic/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/basic/card";
import Link from "next/link";
import { Cliente, Dispositivo } from "@/types/orden";
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Monitor, 
  Calendar, 
  FileText, 
  Plus, 
  ArrowLeft,
  User,
  AlertCircle
} from "lucide-react";

async function getCliente(id: string) {
  const docRef = doc(db, "clientes", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  
  const dispositivos: Dispositivo[] = data.dispositivos || [];
  
  if (!data.dispositivos && data.equipo) {
    dispositivos.push({
      id: `legacy-${Date.now()}`,
      tipo: data.equipo || 'otro',
      marca: 'No especificada',
      modelo: 'No especificado',
      numeroSerie: 'No especificado',
    });
  }

  return {
    id: docSnap.id,
    name: data.name || data.nombre || '',
    cedula: data.cedula || data.cedula || '',
    email: data.email || '',
    phone: data.phone || data.telefono || '',
    address: data.address || data.direccion || '',
    dispositivos,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Cliente;
}

export default function ClienteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const [client, setClient] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Cargar datos del cliente cuando los parámetros estén resueltos
  useEffect(() => {
    const fetchCliente = async () => {
      if (!resolvedParams) return;
      
      setLoading(true);
      const clienteData = await getCliente(resolvedParams.id);
      setClient(clienteData);
      setLoading(false);
    };

    fetchCliente();
  }, [resolvedParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
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
              <User className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{client.name}</h1>
            </div>
            <p className="text-gray-600">Información del cliente</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" className="flex-1 sm:flex-initial">
              <Link href="/clientes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button asChild className="flex-1 sm:flex-initial">
              <Link href={`/clientes/${resolvedParams?.id}/editar`}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Cliente */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2" />
                  Datos de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Cédula</p>
                    <p className="text-sm font-medium">{client.cedula || 'No especificado'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    {client.email ? (
                      <a 
                        href={`mailto:${client.email}`} 
                        className="text-sm font-medium text-blue-600 hover:underline break-all"
                      >
                        {client.email}
                      </a>
                    ) : (
                      <p className="text-sm">No especificado</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    {client.phone ? (
                      <a 
                        href={`tel:${client.phone}`} 
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <p className="text-sm">No especificado</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="text-sm break-words">{client.address || 'No especificada'}</p>
                  </div>
                </div>
                
                {/* Fechas */}
                <div className="border-t pt-4 mt-4 space-y-3">
                  {client.createdAt && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Registrado</div>
                        <div className="text-sm">{new Date(client.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</div>
                      </div>
                    </div>
                  )}
                  {client.updatedAt && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Última actualización</div>
                        <div className="text-sm">{new Date(client.updatedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dispositivos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle className="flex items-center text-lg">
                    <Monitor className="w-5 h-5 mr-2" />
                    Dispositivos ({client.dispositivos?.length || 0})
                  </CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/clientes/${resolvedParams?.id}/editar`}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar dispositivo
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {client.dispositivos && client.dispositivos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.dispositivos.map((dispositivo, index) => (
                      <div 
                        key={dispositivo.id || index} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                            <span className="font-medium text-sm capitalize break-words">
                              {dispositivo.tipo}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clientes/${resolvedParams?.id}/editar`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-gray-500 text-xs">Marca/Modelo:</span>
                            <span className="font-medium break-words">
                              {dispositivo.marca} {dispositivo.modelo}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-gray-500 text-xs">Serie:</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                              {dispositivo.numeroSerie}
                            </span>
                          </div>
                          
                          {dispositivo.fechaCompra && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-gray-500 text-xs">Compra:</span>
                              <span className="break-words">
                                {new Date(dispositivo.fechaCompra).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          )}
                          
                          {dispositivo.observaciones && (
                            <div className="pt-2 border-t mt-2">
                              <span className="text-gray-500 text-xs">Observaciones:</span>
                              <p className="text-xs text-gray-600 mt-1 break-words">
                                {dispositivo.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay dispositivos registrados</p>
                    <Button asChild>
                      <Link href={`/clientes/${resolvedParams?.id}/editar`}>
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar primer dispositivo
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Acciones rápidas */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto py-3">
                <Link href={`/clientes/${resolvedParams?.id}/historial`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Ver historial</div>
                    <div className="text-xs text-gray-500">Órdenes anteriores</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto py-3">
                <Link href={`/ordenes/nueva?clienteId=${resolvedParams?.id}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Crear nueva orden</div>
                    <div className="text-xs text-gray-500">Para este cliente</div>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}