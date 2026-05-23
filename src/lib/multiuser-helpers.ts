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
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
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
      instalacionesSnap
    ] = await Promise.all([
      getCountFromServer(baseQuery),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'preventivo'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'correctivo'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'diagnostico'))),
      getCountFromServer(query(baseQuery, where('tipoMantenimiento', '==', 'instalacion')))
    ]);

    return {
      totalOrdenes: totalSnap.data().count,
      preventivos: preventivosSnap.data().count,
      correctivos: correctivosSnap.data().count,
      diagnosticos: diagnosticosSnap.data().count,
      instalaciones: instalacionesSnap.data().count,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalOrdenes: 0,
      preventivos: 0,
      correctivos: 0,
      diagnosticos: 0,
      instalaciones: 0,
    };
  }
};
import { Cliente, Orden, Negocio, ContadorU } from '@/types/orden';
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

export const actualizarOrden = async (ordenId: string, orden: Partial<Orden>, userId: string): Promise<void> => {
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
    const contadorDoc = await getDoc(contadorRef);
    
    if (contadorDoc.exists()) {
      const contador = contadorDoc.data() as ContadorU;
      const nuevoNumero = contador.siguiente + 1;
      
      await updateDoc(contadorRef, {
        siguiente: nuevoNumero,
        fechaActualizacion: new Date()
      });
      
      return contador.siguiente;
    } else {
      // El primer número debe ser 1, pero el siguiente disponible debe quedar en 2.
      await setDoc(contadorRef, {
        userId,
        siguiente: 2,
        ultimaOrden: '',
        fechaActualizacion: new Date()
      });
      return 1;
    }
  } catch (error) {
    console.error('Error incrementando contador:', error);
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
  try {
    const prefijo = 'OSER';

    // Offline fallback: ID temporal basado en timestamp
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return `${prefijo}${Date.now()}`;
    }

    const numero = await incrementarContador(userId);
    // Mantener padding de 3 para compatibilidad con IDs previos tipo OSER###
    return `${prefijo}${numero.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generando ID por tipo (user-scoped):', error);
    throw error;
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