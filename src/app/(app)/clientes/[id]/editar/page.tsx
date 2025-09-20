import { ClienteForm } from "@/components/clientes/ClienteForm";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/basic/button";
import Link from "next/link";
import { Cliente, Dispositivo } from "@/types/orden";
import { Suspense } from "react";

// Componente de carga esquelético
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div className="w-full md:w-2/3">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="flex flex-wrap gap-4">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getCliente(id: string) {
  const docRef = doc(db, "clientes", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  
  // Asegurar que dispositivos siempre sea un array
  const dispositivos: Dispositivo[] = data.dispositivos || [];
  
  // Migrar datos antiguos si existen (compatibilidad hacia atrás)
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

// Componente para mostrar cuando no se encuentra el cliente
function ClienteNoEncontrado() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center py-12 bg-white rounded-lg shadow-sm max-w-md w-full mx-auto px-6">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Cliente no encontrado</h2>
        <p className="text-gray-600 mb-6">El cliente que buscas no existe o ha sido eliminado.</p>
        <Button asChild className="transition-transform hover:scale-105">
          <Link href="/clientes" className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al listado
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Componente para la cabecera de la página
function PageHeader({ client, params }: { client: Cliente; params: { id: string } }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Editar Cliente</h1>
        <p className="text-gray-600 mt-1 flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {client.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="transition-colors">
          <Link href={`/clientes/${params.id}`} className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver Cliente
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="transition-colors">
          <Link href="/clientes" className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ir al Listado
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Componente para la información adicional del cliente
function ClientInfo({ client }: { client: Cliente }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-gray-500">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Dispositivos registrados: <span className="font-medium text-gray-700 ml-1">{client.dispositivos?.length || 0}</span>
        </span>
        <div className="flex flex-wrap gap-4">
          {client.createdAt && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Creado: {new Date(client.createdAt).toLocaleDateString()}
            </span>
          )}
          {client.updatedAt && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizado: {new Date(client.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ClienteEditPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const client = await getCliente(params.id);

  if (!client) {
    return <ClienteNoEncontrado />;
  }

  return (
    <Suspense fallback={<SkeletonLoader />}>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader client={client} params={params} />
          <ClientInfo client={client} />
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 transition-all duration-300 hover:shadow-md">
            <ClienteForm initialData={client} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}