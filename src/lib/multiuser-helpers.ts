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
} from 'firebase/firestore';
import { Cliente, Orden, Negocio, ContadorU } from '@/types/orden';

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
    const clienteConUserId = {
      ...cliente,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
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
    await updateDoc(clienteRef, {
      ...cliente,
      userId,
      updatedAt: new Date().toISOString()
    });
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

export const crearOrden = async (orden: Omit<Orden, 'id'>, userId: string): Promise<string> => {
  try {
    const ordenConUserId = {
      ...orden,
      userId,
      fechaCreacion: new Date()
    };
    
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
    await updateDoc(ordenRef, {
      ...orden,
      userId
    });
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
    const negocioConUserId = {
      ...negocio,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(negocioRef, negocioConUserId);
  } catch (error) {
    console.error('Error creando negocio:', error);
    throw error;
  }
};

export const actualizarNegocio = async (negocio: Partial<Negocio>, userId: string): Promise<void> => {
  try {
    const negocioRef = doc(db, 'negocios', userId);
    await updateDoc(negocioRef, {
      ...negocio,
      userId,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error actualizando negocio:', error);
    throw error;
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
      await inicializarContador(userId);
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