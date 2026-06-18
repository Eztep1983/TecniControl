// src/lib/orden-serializer.ts

import type { OrdenMantenimiento, SerializableOrdenPayload, TempOrderId } from '@/types/orden'

/**
 * Convierte una orden con Date objects a un payload serializable para localStorage.
 * Ningún campo Date puede guardarse directamente en JSON.
 */
export function serializeOrden(
  orden: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'> & { idPersonalizado?: string }, 
  tempId?: TempOrderId
): SerializableOrdenPayload {
  const toISO = (v: any): string | undefined => {
    if (!v) return undefined
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'string') return v
    return undefined
  }

  return {
    tipo: 'mantenimiento',
    userId: orden.userId,
    clienteId: orden.clienteId,
    dispositivoId: orden.dispositivoId,
    cliente: orden.cliente,
    dispositivo: orden.dispositivo,
    tipoMantenimiento: orden.tipoMantenimiento,
    tareasRealizadas: orden.tareasRealizadas ?? [],
    piezasUsadas: orden.piezasUsadas ?? [],
    observacionesIniciales: orden.observacionesIniciales,
    pruebasRealizadas: orden.pruebasRealizadas,
    posiblesCausas: orden.posiblesCausas,
    diagnosticoFinal: orden.diagnosticoFinal,
    contadorMaquina: orden.contadorMaquina,
    contador: orden.contador ? {
      tipo: orden.contador.tipo,
      valor: orden.contador.valor,
      unidadPersonalizada: orden.contador.unidadPersonalizada,
      fechaRegistro: toISO(orden.contador.fechaRegistro),
      notas: orden.contador.notas,
    } : undefined,
    garantiaHabilitada: orden.garantiaHabilitada,
    garantiaTiempoDesde: toISO(orden.garantiaTiempoDesde),
    garantiaTiempoHasta: toISO(orden.garantiaTiempoHasta),
    garantiaDescripcion: orden.garantiaDescripcion,
    garantiaReferenciaId: orden.garantiaReferenciaId,
    garantiaMotivo: orden.garantiaMotivo,
    instalacionRecomendaciones: orden.instalacionRecomendaciones,
    instalacionRecomendacionesDetalle: orden.instalacionRecomendacionesDetalle,
    instalacionConfiguracion: orden.instalacionConfiguracion,
    instalacionConfiguracionTipos: orden.instalacionConfiguracionTipos,
    firmaCliente: orden.firmaCliente,
    nombreFirmante: orden.nombreFirmante,
    validacionCliente: orden.validacionCliente,
    nombreReceptor: orden.nombreReceptor,
    cedulaReceptor: orden.cedulaReceptor,
    idPersonalizado: orden.idPersonalizado,
    tempId: tempId || (orden as any).tempId,
    horaCreacion: orden.horaCreacion,
    fechaCreacion: toISO(orden.fechaCreacion) ?? new Date().toISOString(),
    createdAt: toISO(orden.createdAt) ?? new Date().toISOString(),
    updatedAt: toISO(orden.updatedAt) ?? new Date().toISOString(),
  }
}

/**
 * Convierte un payload serializado de vuelta a una estructura compatible con Firestore.
 * Las fechas se reconstruyen como objetos Date.
 */
export function deserializeOrdenPayload(payload: SerializableOrdenPayload): Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'> & { idPersonalizado?: string } {
  const toDate = (v: string | undefined): Date | undefined =>
    v ? new Date(v) : undefined

  return {
    ...payload,
    idPersonalizado: payload.idPersonalizado,
    tempId: payload.tempId,
    fechaCreacion: new Date(payload.fechaCreacion),
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    garantiaTiempoDesde: toDate(payload.garantiaTiempoDesde),
    garantiaTiempoHasta: toDate(payload.garantiaTiempoHasta),
    contador: payload.contador ? {
      ...payload.contador,
      tipo: payload.contador.tipo as any,
      fechaRegistro: toDate(payload.contador.fechaRegistro) ?? new Date(),
    } : undefined,
  } as any
}
