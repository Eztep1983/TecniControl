// lib/firebase-utils.ts 
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Función para obtener el próximo número consecutivo
export const obtenerProximoNumeroOrden = async (tipoOrden: 'mantenimiento' | 'diagnostico' | 'garantia' | 'entrega' = 'mantenimiento'): Promise<number> => {
  try {
    const contadorId = `ordenes${tipoOrden.charAt(0).toUpperCase() + tipoOrden.slice(1)}`;
    const contadorRef = doc(db, 'contadores', contadorId);
    
    return await runTransaction(db, async (transaction) => {
      const contadorDoc = await transaction.get(contadorRef);
      
      if (!contadorDoc.exists()) {
        // Si no existe el contador, lo creamos con valor inicial 1
        transaction.set(contadorRef, { ultimoNumero: 1 });
        return 1;
      }
      
      const nuevoNumero = contadorDoc.data().ultimoNumero + 1;
      transaction.update(contadorRef, { ultimoNumero: nuevoNumero });
      return nuevoNumero;
    });
  } catch (error) {
    console.error('Error obteniendo número de orden:', error);
    throw new Error('No se pudo generar el número de orden');
  }
};

// Función para formatear el ID según el tipo
export const formatearIdOrden = (numero: number, tipoOrden: 'mantenimiento' | 'diagnostico' | 'garantia' | 'entrega' = 'mantenimiento'): string => {
  const prefijos = {
    mantenimiento: 'OMAN',
    diagnostico: 'ODIA',
    garantia: 'OGAR',
    entrega: 'OENT'
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