import CryptoJS from 'crypto-js';

/**
 * Utilidades para cifrado de datos en almacenamiento local.
 * Proporciona una capa de seguridad para datos PII (Personally Identifiable Information).
 */

// NOTA: Para una seguridad ideal en producción, esta clave debería ser más dinámica o
// provenir de un entorno seguro. Para protección de LocalStorage contra acceso físico básico,
// usaremos una clave base combinada opcionalmente con el UID del usuario.
const BASE_SECRET = 'tc_local_storage_p_2026_x99';
const FIRESTORE_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'tc_firestore_fallback_2026_x99';

/**
 * Cifra un objeto o string.
 * @param data Datos a cifrar
 * @param userId Opcional: UID del usuario para hacer el cifrado único por sesión
 */
export function encryptData(data: any, userId?: string): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const key = userId ? `${BASE_SECRET}_${userId}` : BASE_SECRET;
    return CryptoJS.AES.encrypt(jsonString, key).toString();
  } catch (error) {
    console.error('[Encryption] Error cifrando datos:', error);
    return '';
  }
}

/**
 * Descifra una cadena.
 * @param encryptedData Cadena cifrada
 * @param userId Opcional: UID del usuario usado durante el cifrado
 */
export function decryptData(encryptedData: string, userId?: string): any {
  if (!encryptedData) return null;
  
  // Si parece ser un JSON (datos antiguos sin cifrar), no intentamos descifrar
  const trimmed = encryptedData.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  try {
    const key = userId ? `${BASE_SECRET}_${userId}` : BASE_SECRET;
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    
    // El error "Malformed UTF-8 data" ocurre aquí si los bytes no son UTF-8 válidos
    // (por ejemplo, por una clave incorrecta). Capturamos esto.
    let decryptedString: string;
    try {
      decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    } catch (utf8Error) {
      console.warn('[Encryption] Datos malformados o clave incorrecta');
      return null;
    }
    
    if (!decryptedString) return null;
    
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('[Encryption] Error descifrando datos:', error);
    return null;
  }
}

// --- ENCRIPTACIÓN PARA FIRESTORE ---

export const CLIENT_SENSITIVE_FIELDS = ['name', 'cedula', 'email', 'phone', 'address'];
export const NEGOCIO_SENSITIVE_FIELDS = ['nombre', 'direccion', 'telefono', 'email', 'nit'];

/**
 * Cifra un texto simple (usado para campos individuales de Firestore).
 * Agrega el prefijo 'ENC:' para poder identificar si el campo está cifrado o no,
 * permitiendo una retrocompatibilidad limpia con datos antiguos en texto plano.
 */
export function encryptString(text: string, userId: string): string {
  if (!text || typeof text !== 'string') return text;
  // Si ya está cifrado, no volver a cifrar
  if (text.startsWith('ENC:')) return text;
  
  try {
    const key = `${FIRESTORE_SECRET}_${userId}`;
    return 'ENC:' + CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error('[Encryption] Error cifrando string:', error);
    return text;
  }
}

/**
 * Descifra un texto simple cifrado con encryptString.
 * Si el texto no tiene el prefijo 'ENC:', se asume que es texto plano (datos legacy) y se retorna tal cual.
 */
export function decryptString(text: string, userId: string): string {
  if (!text || typeof text !== 'string') return text;
  if (!text.startsWith('ENC:')) return text; // Texto plano legacy
  
  try {
    const key = `${FIRESTORE_SECRET}_${userId}`;
    const encrypted = text.substring(4); // Remover 'ENC:'
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // Si la clave era incorrecta o los datos están corruptos, bytes.toString(Utf8) puede ser vacío.
    // Retornamos el string desencriptado, o el original si falló silenciosamente.
    return decrypted || text;
  } catch (error) {
    console.error('[Encryption] Error descifrando string:', error);
    return text;
  }
}

/**
 * Cifra campos específicos de un objeto.
 */
export function encryptSensitiveFields<T extends Record<string, any>>(data: T, fields: string[], userId: string): T {
  if (!data || typeof data !== 'object') return data;
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encryptString(result[field] as string, userId) as any;
    }
  }
  
  return result;
}

/**
 * Descifra campos específicos de un objeto.
 */
export function decryptSensitiveFields<T extends Record<string, any>>(data: T, fields: string[], userId: string): T {
  if (!data || typeof data !== 'object') return data;
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decryptString(result[field] as string, userId) as any;
    }
  }
  
  return result;
}

/**
 * Helper unificado para cifrar entidades antes de enviarlas a Firestore.
 * Detecta el tipo de entidad basado en sus propiedades y cifra los campos correspondientes.
 */
export function encryptFirestoreEntity(entity: any, userId: string): any {
  if (!entity || typeof entity !== 'object') return entity;
  
  let result = { ...entity };

  // Si es un Cliente (tiene cedula o name, pero no es una orden)
  if ((result.cedula !== undefined || result.name !== undefined) && result.tipoMantenimiento === undefined) {
    result = encryptSensitiveFields(result, CLIENT_SENSITIVE_FIELDS, userId);
  }
  
  // Si es un Negocio (tiene nit o nombre)
  if (result.nit !== undefined || result.nombre !== undefined) {
    result = encryptSensitiveFields(result, NEGOCIO_SENSITIVE_FIELDS, userId);
  }

  // Si es una Orden, tiene un cliente anidado
  if (result.cliente && typeof result.cliente === 'object') {
    result.cliente = encryptSensitiveFields(result.cliente, CLIENT_SENSITIVE_FIELDS, userId);
  }

  return result;
}

/**
 * Helper unificado para descifrar entidades apenas se leen de Firestore.
 */
export function decryptFirestoreEntity(entity: any, userId: string): any {
  if (!entity || typeof entity !== 'object') return entity;
  
  let result = { ...entity };

  // Si es un Cliente
  if ((result.cedula !== undefined || result.name !== undefined) && result.tipoMantenimiento === undefined) {
    result = decryptSensitiveFields(result, CLIENT_SENSITIVE_FIELDS, userId);
  }
  
  // Si es un Negocio
  if (result.nit !== undefined || result.nombre !== undefined) {
    result = decryptSensitiveFields(result, NEGOCIO_SENSITIVE_FIELDS, userId);
  }

  // Si es una Orden (contiene cliente)
  if (result.cliente && typeof result.cliente === 'object') {
    result.cliente = decryptSensitiveFields(result.cliente, CLIENT_SENSITIVE_FIELDS, userId);
  }

  return result;
}
