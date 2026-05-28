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
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion';
  tareasRealizadas: string[];
  piezasUsadas: Array<{pieza: string, cantidad: number}>;
  garantiaTiempoDesde: Date | any;
  garantiaTiempoHasta: Date | any;
  garantiaDescripcion: string;
  garantiaHabilitada?: boolean;
  
  // Campos de Instalación
  instalacionRecomendaciones?: boolean;
  instalacionRecomendacionesDetalle?: string;
  instalacionConfiguracion?: boolean;
  instalacionConfiguracionTipos?: string[];
  
  // Firma y Validación
  firmaCliente?: string;
  nombreFirmante?: string;
  validacionCliente?: boolean;

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
  onboardingCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Orden = OrdenMantenimiento;