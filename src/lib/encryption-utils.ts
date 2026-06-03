import CryptoJS from 'crypto-js';

/**
 * Utilidades para cifrado de datos en almacenamiento local.
 * Proporciona una capa de seguridad para datos PII (Personally Identifiable Information).
 */

// NOTA: Para una seguridad ideal en producción, esta clave debería ser más dinámica o
// provenir de un entorno seguro. Para protección de LocalStorage contra acceso físico básico,
// usaremos una clave base combinada opcionalmente con el UID del usuario.
const BASE_SECRET = 'tc_local_storage_p_2026_x99';

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
