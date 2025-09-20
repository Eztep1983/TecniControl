import { ClienteForm } from "@/components/clientes/ClienteForm";
import { Button } from "@/components/ui/basic/button";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";

export default function NuevoClientePage() {
  return (
    <div className="min-h-screen bg-gray-800 p-4 sm:p-6 rounded-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-green-600" />
            Nuevo Cliente
          </h1>
          <Button asChild variant="outline" className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500">
            <Link href="/clientes" className="flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Listado de clientes
            </Link>
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-700 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-white mb-1 text-base sm:text-lg">Información importante</h3>
              <ul className="text-sm text-white space-y-1">
                <li>• Asegúrese de agregar al menos un dispositivo para el cliente</li>
                <li>• El número de serie debe ser único para cada dispositivo</li>
                <li>• Puede agregar múltiples dispositivos del mismo tipo</li>
                <li>• La información del cliente se utilizará para generar órdenes de servicio</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-gray-700 rounded-lg ">
          <ClienteForm />
        </div>
      </div>
    </div>
  );
}
