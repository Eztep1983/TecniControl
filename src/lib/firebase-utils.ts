// lib/firebase-utils.ts 
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Función para obtener el próximo número consecutivo
export const obtenerProximoNumeroOrden = async (tipoOrden: 'mantenimiento' | 'diagnostico' | 'garantia' | 'entrega' = 'mantenimiento'): Promise<number> => {
  // Verificación rápida de conexión (si estamos en web)
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    console.warn('Modo offline detectado: Generando ID temporal');
    return Date.now(); // Retornamos timestamp como ID temporal único
  }

  try {
    const contadorId = `ordenes${tipoOrden.charAt(0).toUpperCase() + tipoOrden.slice(1)}`;
    const contadorRef = doc(db, 'contadores', contadorId);
    
    // Intentar transacción (requiere online)
    return await runTransaction(db, async (transaction) => {
      const contadorDoc = await transaction.get(contadorRef);
      
      if (!contadorDoc.exists()) {
        transaction.set(contadorRef, { ultimoNumero: 1 });
        return 1;
      }
      
      const nuevoNumero = contadorDoc.data().ultimoNumero + 1;
      transaction.update(contadorRef, { ultimoNumero: nuevoNumero });
      return nuevoNumero;
    }); // Se eliminó el objeto de opciones con 'timeout'
// Timeout corto para no bloquear al usuario
  } catch (error) {
    console.error('Error obteniendo número de orden (posible offline):', error);
    // Fallback: Si la transacción falla (probablemente por red), no bloqueamos al usuario
    // Usamos el tiempo actual para asegurar un ID único aunque sea temporal
    return Date.now();
  }
};

// Función para formatear el ID según el tipo
export const formatearIdOrden = (numero: number, tipoOrden: 'mantenimiento'): string => {
  const prefijos = {
    mantenimiento: 'OSER',

  };
  
  return `${prefijos[tipoOrden]}${numero.toString().padStart(3, '0')}`;
};

// Función para validar si un ID ya existe
export const validarIdOrdenUnico = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'ordenes', id);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists(); // Retorna true si NO existe (es único)
  } catch (error) {
    console.error('Error validando ID de orden:', error);
    return false;
  }
};