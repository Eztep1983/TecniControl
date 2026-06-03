/**
 * Utilidades para la gestión de firmas: compresión y ofuscación.
 */

const SIG_PREFIX = 'tc_sig_v1_';
const WEBP_HEADER = 'data:image/webp;base64,';

/**
 * Ofusca una firma en Base64.
 * 1. Elimina el encabezado data:...
 * 2. Invierte la cadena para que no sea legible como base64 estándar.
 * 3. Añade un prefijo interno.
 */
export function obfuscateSignature(dataUrl: string | null): string | null {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;

  try {
    // Extraemos solo el contenido base64 (después de la coma)
    const base64Part = dataUrl.split(',')[1];
    if (!base64Part) return dataUrl;

    // Invertimos la cadena como método de ofuscación simple pero efectivo contra scanners automáticos
    const obfuscated = base64Part.split('').reverse().join('');
    
    return `${SIG_PREFIX}${obfuscated}`;
  } catch (e) {
    console.error('Error ofuscando firma:', e);
    return dataUrl;
  }
}

/**
 * Desofusca una firma para su visualización.
 * Si no tiene el prefijo de ofuscación, la devuelve tal cual (compatibilidad).
 */
export function deobfuscateSignature(obfuscated: string | null): string | null {
  if (!obfuscated) return null;

  if (obfuscated.startsWith(SIG_PREFIX)) {
    try {
      const content = obfuscated.replace(SIG_PREFIX, '');
      const base64Part = content.split('').reverse().join('');
      return `${WEBP_HEADER}${base64Part}`;
    } catch (e) {
      console.error('Error desofuscando firma:', e);
      return null;
    }
  }

  // Si ya es un dataUrl (formatos antiguos), lo devolvemos tal cual
  return obfuscated;
}
