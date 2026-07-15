// types/orden.ts

export interface Dispositivo {
  id: string;
  tipo: string;
  marca: string;
  modelo?: string;
  numeroSerie?: string;
  fechaCompra?: Date;
  observaciones?: string;
  estado?: string;
}

export interface Cliente {
  id: string;
  userId: string; 
  name: string;
  cedula: string;
  email?: string;
  phone?: string;
  address?: string;
  dispositivos: Dispositivo[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrdenBase {
  id: string;
  userId: string; 
  cliente: Cliente;
  dispositivo: Dispositivo;
  fechaCreacion: Date;
}

export interface ContadorU {
  userId: string;
  siguiente: number;
  ultimaOrden: string;
  fechaActualizacion: Date;
}

export interface Contador {
  tipo: 'unidades' | 'impresiones' | 'copias' | 'escaneos' | 'horas' | 'personalizado'
  valor: number
  unidadPersonalizada?: string
  fechaRegistro: Date
  notas?: string
}

export interface OrdenMantenimiento {
  id?: string;
  idPersonalizado: string; // ID consecutivo personalizado
  tipo: 'mantenimiento';
  userId: string;
  cliente: Cliente;
  clienteId: string;
  dispositivo: Dispositivo;
  dispositivoId: string;
  fechaCreacion: Date | any;
  horaCreacion: string;
  observacionesIniciales?: string
  pruebasRealizadas?: string
  posiblesCausas?: string
  diagnosticoFinal?: string
  contadorMaquina?: number
  contador?: Contador;
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia';
  tareasRealizadas: string[];
  piezasUsadas: Array<{pieza: string, cantidad: number}>;
  garantiaTiempoDesde: Date | any;
  garantiaTiempoHasta: Date | any;
  garantiaDescripcion: string;
  garantiaHabilitada?: boolean;

  // Campos de Garantía (Respuesta)
  garantiaReferenciaId?: string;
  garantiaMotivo?: string;
  
  // Campos de Instalación
  instalacionRecomendaciones?: boolean;
  instalacionRecomendacionesDetalle?: string;
  instalacionConfiguracion?: boolean;
  instalacionConfiguracionTipos?: string[];
  
  // Firma y Validación
  firmaCliente?: string;
  nombreFirmante?: string;
  validacionCliente?: boolean;
  nombreReceptor?: string;
  cedulaReceptor?: string;
  tempId?: TempOrderId; // ID temporal para deduplicación

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Negocio {
  id: string;
  userId: string; 
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  nit: string;
  logoUrl?: string;
  firmaUrl?: string;
  onboardingCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Orden = OrdenMantenimiento;

/** ID temporal generado localmente cuando no hay conexión */
export type TempOrderId = `OSER-TEMP-${number}`

/** Estado de sincronización de una orden en cola offline */
export type OrderSyncStatus = 'pending' | 'syncing' | 'failed' | 'synced'

/** Payload de orden serializable para localStorage (sin objetos Date nativos) */
export interface SerializableOrdenPayload {
  // Todos los campos de OrdenMantenimiento pero con fechas como strings ISO
  tipo: 'mantenimiento'
  userId: string
  clienteId: string
  dispositivoId: string
  cliente: Cliente
  dispositivo: Dispositivo
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia'
  tareasRealizadas: string[]
  piezasUsadas: Array<{pieza: string; cantidad: number}>
  // Campos opcionales
  observacionesIniciales?: string
  pruebasRealizadas?: string
  posiblesCausas?: string
  diagnosticoFinal?: string
  contadorMaquina?: number
  contador?: {
    tipo: string
    valor: number
    unidadPersonalizada?: string
    fechaRegistro?: string  // ISO string
    notas?: string
  }
  garantiaHabilitada?: boolean
  garantiaTiempoDesde?: string  // ISO string
  garantiaTiempoHasta?: string  // ISO string
  garantiaDescripcion?: string
  garantiaReferenciaId?: string
  garantiaMotivo?: string
  instalacionRecomendaciones?: boolean
  instalacionRecomendacionesDetalle?: string
  instalacionConfiguracion?: boolean
  instalacionConfiguracionTipos?: string[]
  firmaCliente?: string
  nombreFirmante?: string
  validacionCliente?: boolean
  nombreReceptor?: string
  cedulaReceptor?: string
  idPersonalizado?: string
  tempId?: TempOrderId
  horaCreacion: string
  fechaCreacion: string  // ISO string
  createdAt: string      // ISO string
  updatedAt: string      // ISO string
}

/** Entrada de la cola offline de órdenes */
export interface PendingOrderQueueItem {
  queueId: string
  tempId: TempOrderId
  userId: string
  payload: SerializableOrdenPayload
  enqueuedAt: number
  retries: number
  status: 'pending' | 'syncing' | 'failed'
}
