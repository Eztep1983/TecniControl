// src/app/legal/terminos-servicio/page.tsx
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TerminosServicio() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link 
          href="/login"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <header className="space-y-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Términos de Servicio</h1>
          <p className="text-gray-400 italic">Última actualización: 10 de junio de 2026</p>
        </header>

        <section className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            Bienvenido a <strong>TecniControl</strong>. Al utilizar nuestra aplicación, usted acepta cumplir con los siguientes términos y condiciones de uso. Por favor, léalos atentamente.
          </p>

          <h2 className="text-xl font-semibold text-white">1. Uso de la Plataforma</h2>
          <p>
            TecniControl es una herramienta de gestión para técnicos. El usuario (técnico) es responsable de la exactitud de la información ingresada y del uso ético de la plataforma. La aplicación se proporciona "tal cual" sin garantías explícitas de disponibilidad ininterrumpida.
          </p>

          <h2 className="text-xl font-semibold text-white">2. Responsabilidad sobre Equipos</h2>
          <p>
            TecniControl no es responsable por daños, pérdidas o mal funcionamiento de los equipos recibidos por los técnicos usuarios. La relación contractual de servicio técnico es exclusiva entre el técnico y su cliente final.
          </p>

          <h2 className="text-xl font-semibold text-white">3. Órdenes de Servicio y Firmas</h2>
          <p>
            La generación de una orden de servicio y la captura de una firma digital tienen validez probatoria entre las partes en el marco de la Ley 527 de 1999 (Ley de Comercio Electrónico en Colombia), siempre que se cumplan los requisitos de integridad y autenticidad.
          </p>

          <h2 className="text-xl font-semibold text-white">4. Propiedad Intelectual</h2>
          <p>
            Todo el contenido, diseño y código de TecniControl es propiedad intelectual de los desarrolladores. Queda prohibida la reproducción total o parcial sin autorización previa.
          </p>

          <h2 className="text-xl font-semibold text-white">5. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la aplicación tras dichos cambios constituirá la aceptación de los nuevos términos.
          </p>

          <h2 className="text-xl font-semibold text-white">6. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta ante los tribunales competentes de Colombia.
          </p>
        </section>

        <footer className="pt-12 border-t border-gray-800 text-center text-sm text-gray-500">
          TecniControl - Gestión Profesional de Servicio Técnico
        </footer>
      </div>
    </div>
  )
}
