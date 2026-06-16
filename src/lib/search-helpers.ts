import Fuse from 'fuse.js';

/**
 * Elimina acentos y signos diacríticos de un texto.
 * Ej: "José" -> "jose"
 */
export const removeDiacritics = (text: string): string => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Deja solo caracteres alfanuméricos, útil para teléfonos o cédulas.
 * Ej: "300-123-4567" -> "3001234567"
 */
export const cleanAlphanumeric = (text: string): string => {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

/**
 * Normaliza un objeto de orden en una cadena de texto para búsqueda.
 */
export const buildSearchableString = (orden: any): string => {
  let fechaStr = '';
  if (orden.fechaCreacion) {
    try {
      const ms = typeof orden.fechaCreacion.toMillis === 'function' 
        ? orden.fechaCreacion.toMillis() 
        : new Date(orden.fechaCreacion).getTime();
        
      if (!isNaN(ms)) {
        const date = new Date(ms);
        const f1 = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
        const f2 = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        fechaStr = `${f1} ${f2}`;
      }
    } catch (e) {
      // Ignorar errores de parseo de fecha
    }
  }

  const id = removeDiacritics(orden.idPersonalizado || '');
  const clienteName = removeDiacritics(orden.cliente?.name || '');
  const marca = removeDiacritics(orden.dispositivo?.marca || '');
  const modelo = removeDiacritics(orden.dispositivo?.modelo || '');
  const tipo = removeDiacritics(orden.tipoMantenimiento || '');
  const phone = cleanAlphanumeric(orden.cliente?.phone || '');
  const sn = cleanAlphanumeric(orden.dispositivo?.numeroSerie || '');

  return `${id} ${clienteName} ${marca} ${modelo} ${tipo} ${phone} ${sn} ${fechaStr}`.trim();
};

/**
 * Ejecuta la búsqueda híbrida exacta + difusa sobre una lista local de órdenes.
 */
export const performLocalSearch = (ordenes: any[], busqueda: string, filtroTipo: string = 'todos', limitCount: number = 50) => {
  const query = removeDiacritics(busqueda).trim();
  
  if (!query && filtroTipo === 'todos') {
    return ordenes.slice(0, limitCount);
  }

  // Pre-procesar
  const indexArray = ordenes.map(orden => ({
    ...orden,
    fullText: buildSearchableString(orden)
  }));

  let resultados: any[] = [];
  const tokens = query.split(/\s+/).filter(Boolean);

  if (tokens.length > 0) {
    // 1) Coincidencia EXACTA (AND) manual
    const coincidencias = indexArray.filter(item => {
      return tokens.every(token => item.fullText.includes(token));
    });

    resultados = coincidencias;

    // 2) Fallback a Fuzzy (Fuse.js)
    if (resultados.length === 0) {
      const fuse = new Fuse(indexArray, {
        keys: ['fullText'],
        threshold: 0.4,
        ignoreLocation: true,
        ignoreFieldNorm: true,
      });
      resultados = fuse.search(query).map(r => r.item);
    }
  } else {
    resultados = indexArray;
  }

  // Filtrar por tipo
  if (filtroTipo !== 'todos') {
    resultados = resultados.filter(item => item.tipoMantenimiento === filtroTipo);
  }

  // Limpiar campo temporal y limitar
  return resultados.slice(0, limitCount).map(item => {
    const { fullText, ...rest } = item;
    return rest;
  });
};

/**
 * Pagina una lista de órdenes
 */
export const paginateLocalOrders = (ordenes: any[], page: number, pageSize: number = 10, filtroTipo: string = 'todos') => {
  let filtradas = ordenes;
  if (filtroTipo !== 'todos') {
    filtradas = ordenes.filter(o => o.tipoMantenimiento === filtroTipo);
  }
  
  // Asumiendo que ya vienen ordenadas por fechaCreacion descendente desde onSnapshot
  const start = page * pageSize;
  const pageItems = filtradas.slice(start, start + pageSize);
  
  return {
    ordenes: pageItems,
    nextPage: start + pageSize < filtradas.length ? page + 1 : null,
    total: filtradas.length
  };
};

/**
 * Normaliza un objeto cliente en una cadena de texto para búsqueda.
 */
export const buildClientSearchableString = (cliente: any): string => {
  const name = removeDiacritics(cliente.name || '');
  const email = removeDiacritics(cliente.email || '');
  const phone = cleanAlphanumeric(cliente.phone || '');
  const cedula = cleanAlphanumeric(cliente.cedula || '');
  const address = removeDiacritics(cliente.address || '');

  return `${name} ${email} ${phone} ${cedula} ${address}`.trim();
};

/**
 * Ejecuta búsqueda híbrida exacta + difusa sobre lista de clientes.
 */
export const performLocalClientSearch = (clientes: any[], busqueda: string, limitCount: number = 50) => {
  const query = removeDiacritics(busqueda).trim();
  
  if (!query) {
    return clientes.slice(0, limitCount);
  }

  const indexArray = clientes.map(c => ({
    ...c,
    fullText: buildClientSearchableString(c)
  }));

  const tokens = query.split(/\s+/).filter(Boolean);
  let resultados: any[] = [];

  // 1) Coincidencia EXACTA (AND)
  const coincidencias = indexArray.filter(item => {
    return tokens.every(token => item.fullText.includes(token));
  });

  resultados = coincidencias;

  // 2) Fallback Fuzzy (Fuse)
  if (resultados.length === 0) {
    const fuse = new Fuse(indexArray, {
      keys: ['fullText'],
      threshold: 0.4,
      ignoreLocation: true,
      ignoreFieldNorm: true,
    });
    resultados = fuse.search(query).map(r => r.item);
  }

  return resultados.slice(0, limitCount).map(item => {
    const { fullText, ...rest } = item;
    return rest;
  });
};

/**
 * Pagina una lista local de clientes.
 */
export const paginateLocalClients = (clientes: any[], page: number, pageSize: number = 20) => {
  const start = page * pageSize;
  const pageItems = clientes.slice(start, start + pageSize);
  
  return {
    clientes: pageItems,
    nextPage: start + pageSize < clientes.length ? page + 1 : null,
    total: clientes.length
  };
};
