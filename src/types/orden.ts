// types/orden.ts

export interface Dispositivo {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  fechaCompra?: Date;
  observaciones?: string;
}

export interface Cliente {
  id: string;
  userId: string; 
  name: string;
  cedula: string;
  email: string;
  phone: string;
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

export interface OrdenGarantia extends OrdenBase {
  idPersonalizado: string;
  tipo: 'garantia';
  fechaCompra: Date;
  descripcionProblema: string;
  fechaReporte: Date;
  horaReporte: string;
  piezasUsadas: Array<{pieza: string, cantidad: number}>;
  accionesTomadas: string[];
  estadoInicial: string[];
  estadoFinal: string[];
  reparacionesRealizadas?: string[];
  contadorFinal?: number;
  evidencia?: string[];
  garantiaTiempo: number; 
  garantiaDescripcion: string;

}

export interface OrdenMantenimiento {
  id?: string;
  idPersonalizado: string; // ID consecutivo personalizado
  tipo: 'mantenimiento';
  userId: string;
  cliente: Cliente;
  dispositivo: Dispositivo;
  fechaCreacion: Date | any;
  horaCreacion: string;
  contadorMaquina?: number;
  tipoMantenimiento: 'preventivo' | 'correctivo';
  tareasRealizadas: string[];
  piezasUsadas: Array<{pieza: string, cantidad: number}>;
  garantiaTiempoDesde: Date | any;
  garantiaTiempoHasta: Date | any;
  garantiaDescripcion: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface OrdenDiagnostico extends OrdenBase {
  tipo: 'diagnostico';
  idPersonalizado: string;
  observacionesIniciales: string;
  pruebasRealizadas: string;
  posiblesCausas: string;
  contadorMaquina?: number;
  fechaCompra?: Date;
  diagnosticoFinal: string;
  recomendaciones: string;
}

export interface OrdenEntrega extends OrdenBase {
  tipo: 'entrega';
  fechaEntrega: Date;
  observacionesFinales: string;
  firmaCliente: string;
  validacionCliente: boolean;
  reparacionesRealizadas?: string;
  repuestosUtilizados?: string;
  documentosEntregados?: string;
  contadorFinal?: number;
  garantiaReparacion?: number;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Contador {
  userId: string;
  siguiente: number;
  ultimaOrden: string;
  fechaActualizacion: Date;
}

export type Orden = OrdenGarantia | OrdenMantenimiento | OrdenDiagnostico | OrdenEntrega;