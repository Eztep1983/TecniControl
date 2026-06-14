// src/lib/id-pool-helper.ts
import { decryptData, encryptData } from './encryption-utils';

export interface IDPoolRange {
  year: number;
  nextAvailable: number;
  maxAllowed: number;
}

const POOL_STORAGE_KEY = 'tec_id_pool';

/**
 * Da formato al ID personalizado con el año y un número de 6 dígitos con padding.
 * Ejemplo: OSER-2026-000005
 */
export function formatIdPersonalizado(year: number, consecutivo: number): string {
  return `OSER-${year}-${consecutivo.toString().padStart(6, '0')}`;
}

/**
 * Recupera el pool de IDs local del localStorage y lo descifra.
 */
export function getLocalIdPool(userId: string): IDPoolRange | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${POOL_STORAGE_KEY}_${userId}`);
    if (!raw) return null;

    const decrypted = decryptData(raw, userId);
    if (decrypted && typeof decrypted === 'object' && 'year' in decrypted && 'nextAvailable' in decrypted && 'maxAllowed' in decrypted) {
      return decrypted as IDPoolRange;
    }
    return null;
  } catch (error) {
    console.error('[IDPoolHelper] Error recuperando pool local:', error);
    return null;
  }
}

/**
 * Guarda el pool de IDs local cifrado en el localStorage.
 */
export function saveLocalIdPool(userId: string, pool: IDPoolRange): void {
  if (typeof window === 'undefined') return;
  try {
    const encrypted = encryptData(pool, userId);
    localStorage.setItem(`${POOL_STORAGE_KEY}_${userId}`, encrypted);
  } catch (error) {
    console.warn('[IDPoolHelper] Error guardando pool local:', error);
  }
}

/**
 * Limpia el pool de IDs local del localStorage.
 */
export function clearLocalIdPool(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${POOL_STORAGE_KEY}_${userId}`);
  } catch (error) {
    console.warn('[IDPoolHelper] Error limpiando pool local:', error);
  }
}

/**
 * Extrae el siguiente ID válido del pool local y actualiza su estado.
 * Retorna null si el pool está agotado, vencido (de otro año) o no existe.
 */
export function obtenerSiguienteIdDePool(userId: string): string | null {
  const pool = getLocalIdPool(userId);
  if (!pool) return null;

  const currentYear = new Date().getFullYear();

  // Si el pool es de un año anterior, lo invalidamos (se reinicia la secuencia por año)
  if (pool.year !== currentYear) {
    clearLocalIdPool(userId);
    return null;
  }

  // Verificar si ya se agotaron los IDs de este bloque
  if (pool.nextAvailable > pool.maxAllowed) {
    return null;
  }

  const consecutivo = pool.nextAvailable;

  // Actualizar el pool local con el siguiente consecutivo
  saveLocalIdPool(userId, {
    ...pool,
    nextAvailable: consecutivo + 1,
  });

  return formatIdPersonalizado(currentYear, consecutivo);
}
