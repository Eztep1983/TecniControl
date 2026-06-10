// src/app/legal/politica-privacidad/page.tsx
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PoliticaPrivacidad() {
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
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Política de Privacidad</h1>
          <p className="text-gray-400 italic">Última actualización: 10 de junio de 2026</p>
        </header>

        <section className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            En <strong>TecniControl</strong>, valoramos su privacidad y estamos comprometidos con la protección de sus datos personales. Esta política detalla cómo recolectamos, usamos y protegemos la información en cumplimiento de la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales) de la República de Colombia.
          </p>

          <h2 className="text-xl font-semibold text-white">1. Responsable del Tratamiento</h2>
          <p>
            TecniControl actúa como plataforma de gestión para técnicos independientes. El técnico que utiliza la aplicación es el Responsable del Tratamiento de los datos de sus clientes finales, mientras que TecniControl actúa como Encargado del Tratamiento en la medida en que provee la infraestructura de almacenamiento (vía Google Firebase).
          </p>

          <h2 className="text-xl font-semibold text-white">2. Datos Recolectados</h2>
          <p>
            Recolectamos los siguientes tipos de información:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Datos de Identificación:</strong> Nombres, apellidos, número de identificación (Cédula/NIT).</li>
            <li><strong>Datos de Contacto:</strong> Dirección, correo electrónico, número telefónico.</li>
            <li><strong>Datos del Dispositivo:</strong> Marca, modelo, número de serie, estado técnico.</li>
            <li><strong>Datos Biométricos:</strong> Firma manuscrita digitalizada (recolectada exclusivamente para la validación de órdenes de servicio).</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">3. Finalidad del Tratamiento</h2>
          <p>
            Los datos son utilizados para:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Generar y gestionar órdenes de servicio técnico.</li>
            <li>Mantener un historial de servicios para el cliente.</li>
            <li>Comunicar el estado de las reparaciones vía WhatsApp o correo electrónico.</li>
            <li>Garantizar la trazabilidad y legalidad de la entrega de equipos mediante la firma de conformidad.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">4. Derechos de los Titulares</h2>
          <p>
            De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Conocer, actualizar y rectificar sus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se le ha dado a sus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
            <li>Revocar la autorización y/o solicitar la supresión del dato cuando no se respeten los principios, derechos y garantías constitucionales y legales.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">5. Seguridad de la Información</h2>
          <p>
            Implementamos medidas de seguridad técnicas y administrativas para proteger sus datos, incluyendo encriptación en tránsito y almacenamiento seguro mediante Google Firebase App Check. No compartimos sus datos con terceros con fines comerciales.
          </p>

          <h2 className="text-xl font-semibold text-white">6. Contacto</h2>
          <p>
            Para ejercer sus derechos de Habeas Data, puede contactar al soporte técnico de la aplicación a través del correo electrónico configurado en su perfil de usuario o mediante el técnico responsable de su orden de servicio.
          </p>
        </section>

        <footer className="pt-12 border-t border-gray-800 text-center text-sm text-gray-500">
          TecniControl - Gestión Profesional de Servicio Técnico
        </footer>
      </div>
    </div>
  )
}
