// lib/multiuser-helpers.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  runTransaction,
} from 'firebase/firestore';

// ... (existing imports)

/**
 * Obtiene estadísticas resumidas sin descargar todos los documentos (Optimización Dashboard)
 */
export const getEstadisticasPorUsuario = async (userId: string) => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const baseQuery = query(ordenesRef, where('userId', '==', userId));
    
    const [
      totalSnap,
      preventivosSnap,
      correctivosSnap,
      diagnosticosSnap,
      instalacionesSnap,
      garantiasSnap
    ] = await Promise.all([
      getCountFromServer(baseQuery),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'preventivo'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'correctivo'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'diagnostico'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'instalacion'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'garantia')))
    ]);

    return {
      totalOrdenes: totalSnap.data().count,
      preventivos: preventivosSnap.data().count,
      correctivos: correctivosSnap.data().count,
      diagnosticos: diagnosticosSnap.data().count,
      instalaciones: instalacionesSnap.data().count,
      garantias: garantiasSnap.data().count,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalOrdenes: 0,
      preventivos: 0,
      correctivos: 0,
      diagnosticos: 0,
      instalaciones: 0,
      garantias: 0,
    };
  }
};
import { Cliente, Orden, Negocio, ContadorU, OrdenMantenimiento } from '@/types/orden';
import {
  sanitizeClientePayload,
  sanitizeNegocioPayload,
  sanitizeOrdenPayload,
} from '@/lib/firestore-sanitizers';

// Cliente helpers
export const getClientesPorUsuario = async (userId: string): Promise<Cliente[]> => {
  try {
    const clientesRef = collection(db, 'clientes');
    const q = query(clientesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Cliente[];
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return [];
  }
};

export const crearCliente = async (cliente: Omit<Cliente, 'id'>, userId: string): Promise<string> => {
  try {
    const clienteConUserId = sanitizeClientePayload({
      ...cliente,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!clienteConUserId.name || !clienteConUserId.userId) {
      throw new Error('Cliente inválido: nombre y userId son requeridos.');
    }

    const docRef = await addDoc(collection(db, 'clientes'), clienteConUserId);
    return docRef.id;
  } catch (error) {
    console.error('Error creando cliente:', error);
    throw error;
  }
};

export const actualizarCliente = async (clienteId: string, cliente: Partial<Cliente>, userId: string): Promise<void> => {
  try {
    const clienteRef = doc(db, 'clientes', clienteId);
    const clienteActualizado = sanitizeClientePayload({
      ...cliente,
      userId,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(clienteRef, clienteActualizado);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    throw error;
  }
};

export const eliminarCliente = async (clienteId: string, userId: string): Promise<void> => {
  try {
    const clienteRef = doc(db, 'clientes', clienteId);
    await deleteDoc(clienteRef);
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    throw error;
  }
};

// Orden helpers
export const getOrdenesPorUsuario = async (userId: string): Promise<Orden[]> => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const q = query(ordenesRef, where('userId', '==', userId), orderBy('fechaCreacion', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Orden[];
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
};

/**
 * Obtiene órdenes paginadas para uso con useInfiniteQuery
 */
export const getOrdenesPaginadas = async (userId: string, pageSize: number = 10, lastDoc: any = null) => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    let q;
    
    if (lastDoc) {
      q = query(
        ordenesRef, 
        where('userId', '==', userId), 
        orderBy('fechaCreacion', 'desc'), 
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        ordenesRef, 
        where('userId', '==', userId), 
        orderBy('fechaCreacion', 'desc'), 
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    const ordenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Orden[];
    
    return { ordenes, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error obteniendo órdenes paginadas:', error);
    return { ordenes: [], lastDoc: null };
  }
};

/**
 * Obtiene órdenes paginadas con un filtro opcional de tipo de mantenimiento
 */
export const getOrdenesPaginadasConFiltro = async (
  userId: string,
  pageSize: number = 10,
  lastDoc: any = null,
  tipoMantenimiento: string = 'todos'
) => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const constraints: any[] = [
      where('userId', '==', userId),
      where('tipo', '==', 'mantenimiento')
    ];

    if (tipoMantenimiento && tipoMantenimiento !== 'todos') {
      constraints.push(where('tipoMantenimiento', '==', tipoMantenimiento));
    }

    constraints.push(orderBy('fechaCreacion', 'desc'));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(pageSize));

    const q = query(ordenesRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    const ordenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Orden[];

    return { ordenes, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error obteniendo órdenes paginadas con filtro:', error);
    return { ordenes: [], lastDoc: null };
  }
};

/**
 * Obtiene todas las órdenes (sin paginación) filtradas por tipo de mantenimiento
 * para realizar búsqueda client-side sobre el set de datos filtrado.
 */
export const getTodasLasOrdenesConFiltro = async (
  userId: string,
  tipoMantenimiento: string = 'todos'
): Promise<Orden[]> => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const constraints: any[] = [
      where('userId', '==', userId),
      where('tipo', '==', 'mantenimiento')
    ];

    if (tipoMantenimiento && tipoMantenimiento !== 'todos') {
      constraints.push(where('tipoMantenimiento', '==', tipoMantenimiento));
    }

    constraints.push(orderBy('fechaCreacion', 'desc'));

    const q = query(ordenesRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Orden[];
  } catch (error) {
    console.error('Error obteniendo todas las órdenes con filtro:', error);
    return [];
  }
};

/**
 * Retorna un resumen de la orden omitiendo campos pesados (DTO pattern)
 */
export const mapToOrdenResumen = (orden: any): Partial<Orden> => {
  const { 
    actividades, 
    repuestos, 
    firmaCliente, 
    firmaTecnico, 
    ...resumen 
  } = orden;
  return resumen;
};

export const crearOrden = async (orden: Omit<Orden, 'id'>, userId: string): Promise<string> => {
  try {
    const ordenConUserId = sanitizeOrdenPayload({
      ...orden,
      userId,
      fechaCreacion: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!ordenConUserId.userId || !ordenConUserId.tipo || !ordenConUserId.clienteId || !ordenConUserId.dispositivoId) {
      throw new Error('Orden inválida: faltan campos requeridos.');
    }

    const docRef = await addDoc(collection(db, 'ordenes'), ordenConUserId);
    return docRef.id;
  } catch (error) {
    console.error('Error creando orden:', error);
    throw error;
  }
};

export const actualizarOrden = async (ordenId: string, orden: Partial<OrdenMantenimiento>, userId: string): Promise<void> => {
  try {
    const ordenRef = doc(db, 'ordenes', ordenId);
    const ordenActualizada = sanitizeOrdenPayload({
      ...orden,
      userId,
    });

    await updateDoc(ordenRef, ordenActualizada);


  } catch (error) {
    console.error('Error actualizando orden:', error);
    throw error;
  }
};

/**
 * Crea una orden e incrementa el contador de usuario de forma atómica.
 * Excluye tempId y garantiza la consecutividad de los IDs personalizados con formato anual.
 */
export const crearOrdenAtomica = async (
  ordenData: Omit<Orden, 'id' | 'idPersonalizado'>,
  userId: string
): Promise<{ id: string; idPersonalizado: string }> => {
  const contadorRef = doc(db, 'contadores', userId);
  const nuevaOrdenRef = doc(collection(db, 'ordenes'));
  const currentYear = new Date().getFullYear();
  let idPersonalizado = '';

  await runTransaction(db, async (transaction) => {
    // 1. Obtener y actualizar contador
    const snap = await transaction.get(contadorRef);
    let consecutivo = 1;

    if (!snap.exists()) {
      const siguientePorAnio = {
        [currentYear]: 2
      };
      transaction.set(contadorRef, {
        userId,
        siguiente: 2, // Para compatibilidad
        ultimaOrden: '',
        fechaActualizacion: new Date(),
        siguientePorAnio
      });
    } else {
      const data = snap.data();
      const siguientePorAnio = data.siguientePorAnio || {};
      consecutivo = Number(siguientePorAnio[currentYear]) || 1;
      siguientePorAnio[currentYear] = consecutivo + 1;

      transaction.update(contadorRef, {
        siguientePorAnio,
        fechaActualizacion: new Date(),
      });
    }

    idPersonalizado = `OSER-${currentYear}-${consecutivo.toString().padStart(6, '0')}`;

    // 2. Preparar el payload de la orden
    const { tempId, ...ordenSinTempId } = ordenData as any; // Asegurar exclusión de tempId
    const ordenCompleta = sanitizeOrdenPayload({
      ...ordenSinTempId,
      idPersonalizado,
      userId,
      updatedAt: new Date(),
    });

    // 3. Escribir documento en la transacción
    transaction.set(nuevaOrdenRef, ordenCompleta);
  });

  return { id: nuevaOrdenRef.id, idPersonalizado };
};

/**
 * Reserva un rango de IDs consecutivos para un usuario y año actuales.
 */
export const reservarBloqueIds = async (
  userId: string,
  size: number = 10
): Promise<{ year: number; nextAvailable: number; maxAllowed: number }> => {
  const contadorRef = doc(db, 'contadores', userId);
  const currentYear = new Date().getFullYear();
  let range: { year: number; nextAvailable: number; maxAllowed: number } | null = null;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(contadorRef);
    let consecutivo = 1;

    if (!snap.exists()) {
      const siguientePorAnio = {
        [currentYear]: 1 + size
      };
      transaction.set(contadorRef, {
        userId,
        siguiente: 1, // Para compatibilidad
        ultimaOrden: '',
        fechaActualizacion: new Date(),
        siguientePorAnio
      });
      consecutivo = 1;
    } else {
      const data = snap.data();
      const siguientePorAnio = data.siguientePorAnio || {};
      consecutivo = Number(siguientePorAnio[currentYear]) || 1;
      siguientePorAnio[currentYear] = consecutivo + size;

      transaction.update(contadorRef, {
        siguientePorAnio,
        fechaActualizacion: new Date()
      });
    }

    range = {
      year: currentYear,
      nextAvailable: consecutivo,
      maxAllowed: consecutivo + size - 1
    };
  });

  if (!range) {
    throw new Error('No se pudo reservar el bloque de IDs');
  }

  return range;
};

// Negocio helpers
export const getNegocioPorUsuario = async (userId: string): Promise<Negocio | null> => {
  try {
    const negocioRef = doc(db, 'negocios', userId);
    const negocioDoc = await getDoc(negocioRef);
    
    if (negocioDoc.exists()) {
      return {
        id: negocioDoc.id,
        ...negocioDoc.data()
      } as Negocio;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo negocio:', error);
    return null;
  }
};

export const crearNegocio = async (negocio: Omit<Negocio, 'id'>, userId: string): Promise<void> => {
  try {
    const negocioRef = doc(db, 'negocios', userId);
    const negocioConUserId = sanitizeNegocioPayload({
      ...negocio,
      userId,
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!negocioConUserId.userId || !negocioConUserId.nombre) {
      throw new Error('Negocio inválido: userId y nombre son requeridos.');
    }

    await setDoc(negocioRef, negocioConUserId);
  } catch (error) {
    console.error('Hubo un error creando negocio:', error);
    throw error;
  }
};

export const actualizarNegocio = async (negocio: Partial<Negocio>, userId: string): Promise<void> => {
  try {
    const negocioRef = doc(db, 'negocios', userId);
    const negocioActualizado = sanitizeNegocioPayload({
      ...negocio,
      userId,
      updatedAt: new Date(),
    });

    await updateDoc(negocioRef, negocioActualizado);
  } catch (error) {
    console.error('Error actualizando negocio:', error);
    throw error;
  }
};

/**
 * Marca el onboarding como completado para el usuario en Firestore
 */
export const completarOnboarding = async (userId: string): Promise<void> => {
  try {
    const negocioRef = doc(db, 'negocios', userId);
    await setDoc(negocioRef, {
      userId,
      onboardingCompleted: true,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error completando onboarding:', error);
  }
};

// Contador helpers
export const getContadorPorUsuario = async (userId: string): Promise<ContadorU | null> => {
  try {
    const contadorRef = doc(db, 'contadores', userId);
    const contadorDoc = await getDoc(contadorRef);
    
    if (contadorDoc.exists()) {
      return contadorDoc.data() as ContadorU;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo contador:', error);
    return null;
  }
};

export const inicializarContador = async (userId: string): Promise<void> => {
  try {
    const contadorRef = doc(db, 'contadores', userId);
    const contador: ContadorU = {
      userId,
      siguiente: 1,
      ultimaOrden: '',
      fechaActualizacion: new Date()
    };
    
    await setDoc(contadorRef, contador);
  } catch (error) {
    console.error('Error inicializando contador:', error);
    throw error;
  }
};

export const incrementarContador = async (userId: string): Promise<number> => {
  try {
    const contadorRef = doc(db, 'contadores', userId);
    let resultado: number = -1;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(contadorRef);

      if (!snap.exists()) {
        resultado = 1;
        transaction.set(contadorRef, {
          userId,
          siguiente: 2,
          ultimaOrden: '',
          fechaActualizacion: new Date()
        });
      } else {
        const data = snap.data() as ContadorU;
        resultado = data.siguiente;
        transaction.update(contadorRef, {
          siguiente: resultado + 1,
          fechaActualizacion: new Date()
        });
      }
    });

    if (resultado === -1) throw new Error('Transacción de contador fallida');
    return resultado;
  } catch (error) {
    console.error('Error incrementando contador (atómico):', error);
    throw error;
  }
};

// Función para generar ID personalizado de orden
export const generarIdPersonalizado = async (userId: string, prefijo: string = 'ORD'): Promise<string> => {
  try {
    const numero = await incrementarContador(userId);
    return `${prefijo}-${numero.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generando ID personalizado:', error);
    throw error;
  }
};

// Generar ID por usuario (ahora todas las órdenes usan 'mantenimiento' y el prefijo 'OSER')
export const generarIdPorTipo = async (userId: string, _tipoOrden: 'mantenimiento' | 'diagnostico' | 'garantia' | 'entrega' = 'mantenimiento'): Promise<string> => {
  const prefijo = 'OSER';
  
  try {
    // Offline fallback: ID temporal basado en navigator.onLine (rápido)
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return `${prefijo}-TEMP-${Date.now()}`;
    }

    const numero = await incrementarContador(userId);
    // Mantener padding de 3 para compatibilidad con IDs previos tipo OSER###
    return `${prefijo}${numero.toString().padStart(3, '0')}`;
  } catch (error) {
    // Si falla por red u otra razón, no bloquear el flujo del técnico
    console.warn('Error generando ID online, usando fallback temporal:', error);
    return `${prefijo}-TEMP-${Date.now()}`;
  }
};

// Función para verificar permisos de usuario
export const verificarPermisoUsuario = async (documentId: string, userId: string, coleccion: string): Promise<boolean> => {
  try {
    const docRef = doc(db, coleccion, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.userId === userId;
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return false;
  }
};
