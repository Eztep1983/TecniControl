import { Cliente, Dispositivo, Negocio, OrdenMantenimiento } from '@/types/orden'
import type { TareaPredefinida, PiezaPredefinida } from './configuracion-helpers'

const cleanString = (value: any): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

const cleanBoolean = (value: any): boolean | undefined => {
  return typeof value === 'boolean' ? value : undefined
}

const cleanNumber = (value: any): number | undefined => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined
}

const cleanDate = (value: any): Date | undefined => {
  return value instanceof Date ? value : undefined
}

const parseDateLike = (value: any): Date | undefined => {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  return undefined
}

const cleanStringArray = (value: any): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  return value
    .map(cleanString)
    .filter((item): item is string => Boolean(item))
}

const setIfDefined = <T extends object, K extends PropertyKey>(obj: T, key: K, value: any) => {
  if (value !== undefined) {
    ;(obj as any)[key] = value
  }
}

const sanitizeDispositivo = (input: any): Dispositivo | undefined => {
  if (!input || typeof input !== 'object') return undefined

  const tipo = cleanString(input.tipo)
  if (!tipo) return undefined
  const result: Partial<Dispositivo> = {
    id: cleanString(input.id) ?? '',
    tipo,
    marca: cleanString(input.marca) ?? '',
  }
  setIfDefined(result, 'modelo', cleanString(input.modelo))
  setIfDefined(result, 'numeroSerie', cleanString(input.numeroSerie))
  setIfDefined(result, 'observaciones', cleanString(input.observaciones))
  setIfDefined(result, 'estado', cleanString(input.estado))
  return result as Dispositivo
}

export const sanitizeClientePayload = (input: any): Partial<Cliente> => {
  const cleaned: Partial<Cliente> = {}
  if (!input || typeof input !== 'object') return cleaned

  const userId = cleanString(input.userId)
  if (userId) cleaned.userId = userId

  const name = cleanString(input.name)
  if (name) cleaned.name = name

  const cedula = cleanString(input.cedula)
  if (cedula) cleaned.cedula = cedula

  const email = cleanString(input.email)
  if (email) cleaned.email = email

  const phone = cleanString(input.phone)
  if (phone) cleaned.phone = phone

  const address = cleanString(input.address)
  if (address) cleaned.address = address

  if (Array.isArray(input.dispositivos)) {
    const dispositivos = input.dispositivos
      .map(sanitizeDispositivo)
      .filter((item:any): item is Dispositivo => Boolean(item))

    cleaned.dispositivos = dispositivos
  }

  setIfDefined(cleaned, 'createdAt', cleanString(input.createdAt))
  setIfDefined(cleaned, 'updatedAt', cleanString(input.updatedAt))

  const id = cleanString(input.id)
  if (id) cleaned.id = id

  return cleaned
}

export const sanitizeNegocioPayload = (input: any): Partial<Negocio> => {
  const cleaned: Partial<Negocio> = {}
  if (!input || typeof input !== 'object') return cleaned

  const userId = cleanString(input.userId)
  if (userId) cleaned.userId = userId

  const nombre = cleanString(input.nombre)
  if (nombre) cleaned.nombre = nombre

  const direccion = cleanString(input.direccion)
  if (direccion) cleaned.direccion = direccion

  const telefono = cleanString(input.telefono)
  if (telefono) cleaned.telefono = telefono

  const email = cleanString(input.email)
  if (email) cleaned.email = email

  const nit = cleanString(input.nit)
  if (nit) cleaned.nit = nit

  const logoUrl = cleanString(input.logoUrl)
  if (logoUrl) cleaned.logoUrl = logoUrl

  setIfDefined(cleaned, 'onboardingCompleted', cleanBoolean(input.onboardingCompleted))
  setIfDefined(cleaned, 'createdAt', cleanDate(input.createdAt))
  setIfDefined(cleaned, 'updatedAt', cleanDate(input.updatedAt))

  const id = cleanString(input.id)
  if (id) cleaned.id = id

  return cleaned
}

export const sanitizeOrdenPayload = (input: any): Partial<OrdenMantenimiento> => {
  const cleaned: Partial<OrdenMantenimiento> = {}
  if (!input || typeof input !== 'object') return cleaned

  const userId = cleanString(input.userId)
  if (userId) cleaned.userId = userId

  const tipo = cleanString(input.tipo)
  if (tipo) cleaned.tipo = tipo as OrdenMantenimiento['tipo']

  const idPersonalizado = cleanString(input.idPersonalizado)
  if (idPersonalizado) cleaned.idPersonalizado = idPersonalizado

  const clienteId = cleanString(input.clienteId)
  if (clienteId) cleaned.clienteId = clienteId

  const dispositivoId = cleanString(input.dispositivoId)
  if (dispositivoId) cleaned.dispositivoId = dispositivoId

  if (input.cliente && typeof input.cliente === 'object') {
    const cliente = sanitizeClientePayload(input.cliente)
    if (cliente.name) cleaned.cliente = cliente as Cliente
  }

  if (input.dispositivo && typeof input.dispositivo === 'object') {
    const dispositivo = sanitizeDispositivo(input.dispositivo)
    if (dispositivo) cleaned.dispositivo = dispositivo
  }

  setIfDefined(cleaned, 'fechaCreacion', parseDateLike(input.fechaCreacion))
  setIfDefined(cleaned, 'horaCreacion', cleanString(input.horaCreacion))
  setIfDefined(cleaned, 'observacionesIniciales', cleanString(input.observacionesIniciales))
  setIfDefined(cleaned, 'pruebasRealizadas', cleanString(input.pruebasRealizadas))
  setIfDefined(cleaned, 'posiblesCausas', cleanString(input.posiblesCausas))
  setIfDefined(cleaned, 'diagnosticoFinal', cleanString(input.diagnosticoFinal))

  const contadorMaquina = cleanNumber(input.contadorMaquina)
  if (contadorMaquina !== undefined) cleaned.contadorMaquina = contadorMaquina

  if (input.contador && typeof input.contador === 'object') {
    const valor = cleanNumber(input.contador.valor)
    if (valor !== undefined) {
      const contadorTipo = cleanString(input.contador.tipo)
      const contadorTipos = ['personalizado', 'unidades', 'impresiones', 'copias', 'escaneos', 'horas'] as const
      const tipo = contadorTipo && contadorTipos.includes(contadorTipo as any)
        ? contadorTipo as typeof contadorTipos[number]
        : 'personalizado'

      const contadorPayload: any = {
        tipo,
        valor,
      }
      setIfDefined(contadorPayload, 'unidadPersonalizada', cleanString(input.contador.unidadPersonalizada))
      setIfDefined(contadorPayload, 'fechaRegistro', parseDateLike(input.contador.fechaRegistro))
      setIfDefined(contadorPayload, 'notas', cleanString(input.contador.notas))
      cleaned.contador = contadorPayload
    }
  }

  setIfDefined(cleaned, 'tipoMantenimiento', cleanString(input.tipoMantenimiento) as OrdenMantenimiento['tipoMantenimiento'])

  setIfDefined(cleaned, 'tareasRealizadas', cleanStringArray(input.tareasRealizadas))

  if (Array.isArray(input.piezasUsadas)) {
    const piezasUsadas = input.piezasUsadas
      .map((item: any) => {
        if (!item || typeof item !== 'object') return undefined
        const pieza = cleanString(item.pieza)
        const cantidad = cleanNumber(item.cantidad)
        if (!pieza || cantidad === undefined) return undefined
        return { pieza, cantidad }
      })
      .filter((item:any): item is { pieza: string; cantidad: number } => Boolean(item))
    if (piezasUsadas.length) {
      cleaned.piezasUsadas = piezasUsadas
    }
  }

  if (input.garantiaHabilitada === true) {
    cleaned.garantiaHabilitada = true
  }
  setIfDefined(cleaned, 'garantiaTiempoDesde', parseDateLike(input.garantiaTiempoDesde))
  setIfDefined(cleaned, 'garantiaTiempoHasta', parseDateLike(input.garantiaTiempoHasta))
  setIfDefined(cleaned, 'garantiaDescripcion', cleanString(input.garantiaDescripcion))
  setIfDefined(cleaned, 'garantiaReferenciaId', cleanString(input.garantiaReferenciaId))
  setIfDefined(cleaned, 'garantiaMotivo', cleanString(input.garantiaMotivo))
  setIfDefined(cleaned, 'instalacionRecomendaciones', cleanBoolean(input.instalacionRecomendaciones))
  setIfDefined(cleaned, 'instalacionRecomendacionesDetalle', cleanString(input.instalacionRecomendacionesDetalle))
  setIfDefined(cleaned, 'instalacionConfiguracion', cleanBoolean(input.instalacionConfiguracion))
  setIfDefined(cleaned, 'instalacionConfiguracionTipos', cleanStringArray(input.instalacionConfiguracionTipos))
  setIfDefined(cleaned, 'firmaCliente', cleanString(input.firmaCliente))
  setIfDefined(cleaned, 'nombreFirmante', cleanString(input.nombreFirmante))
  setIfDefined(cleaned, 'validacionCliente', cleanBoolean(input.validacionCliente))
  // tempId no se debe subir a Firestore (campo estrictamente local/offline)

  setIfDefined(cleaned, 'createdAt', parseDateLike(input.createdAt))
  setIfDefined(cleaned, 'updatedAt', parseDateLike(input.updatedAt))

  return cleaned
}

export const sanitizeTareaPayload = (input: any): Partial<TareaPredefinida> => {
  const cleaned: Partial<TareaPredefinida> = {}
  if (!input || typeof input !== 'object') return cleaned

  const nombre = cleanString(input.nombre)
  if (nombre) cleaned.nombre = nombre

  const tipo = cleanString(input.tipo)
  if (tipo) cleaned.tipo = tipo as TareaPredefinida['tipo']

  const categoria = cleanString(input.categoria)
  if (categoria) cleaned.categoria = categoria

  return cleaned
}

export const sanitizePiezaPayload = (input: any): Partial<PiezaPredefinida> => {
  const cleaned: Partial<PiezaPredefinida> = {}
  if (!input || typeof input !== 'object') return cleaned

  const nombre = cleanString(input.nombre)
  if (nombre) cleaned.nombre = nombre

  const categoria = cleanString(input.categoria)
  if (categoria) cleaned.categoria = categoria

  return cleaned
}
