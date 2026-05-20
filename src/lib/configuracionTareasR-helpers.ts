/**
 * SUBCOLLECCIONES en vez de arrays en un solo documento.
 * 
 * Formato ANTIGUO (costoso):
 *   userConfig/{uid}  →  { tareasPredefinidas: [...100 items], piezasPredefinidas: [...100 items] }
 *   Cada cambio = reescritura del documento completo → N writes innecesarios
 *
 * Formato NUEVO (granular):
 *   userConfig/{uid}/tareas/{id}  →  { nombre, tipo, categoria }
 *   userConfig/{uid}/piezas/{id}  →  { nombre, categoria }
 *   Cada cambio = 1 write al documento exacto que cambió
 *
 * Costo comparado:
 *   - Antes: editar 1 tarea de 50 = 1 escritura de ~5KB
 *   - Ahora: editar 1 tarea de 50 = 1 escritura de ~100 bytes  (~50x más barato)
 */

import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, writeBatch, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { sanitizeTareaPayload, sanitizePiezaPayload } from './firestore-sanitizers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface TareaPredefinida {
  id: string
  nombre: string
  tipo: 'preventivo' | 'correctivo' | 'ambos'
  categoria: string
}

export interface PiezaPredefinida {
  id: string
  nombre: string
  categoria: string
}

// ─── Referencias ─────────────────────────────────────────────────────────────

const tareasCol = (uid: string) =>
  collection(db, 'userConfig', uid, 'tareas')

const piezasCol = (uid: string) =>
  collection(db, 'userConfig', uid, 'piezas')

const tareaDocRef = (uid: string, id: string) =>
  doc(db, 'userConfig', uid, 'tareas', id)

const piezaDocRef = (uid: string, id: string) =>
  doc(db, 'userConfig', uid, 'piezas', id)

const configDocRef = (uid: string) =>
  doc(db, 'userConfig', uid)

// ─── LECTURA ──────────────────────────────────────────────────────────────────

export const obtenerTareasPredefinidas = async (
  uid: string
): Promise<TareaPredefinida[]> => {
  // Migrar silenciosamente si hay datos en formato antiguo
  await migrarSiEsNecesario(uid)

  const snap = await getDocs(tareasCol(uid))
  if (snap.empty) {
    await sembrarTareas(uid)
    const snap2 = await getDocs(tareasCol(uid))
    return snap2.docs.map(d => ({ id: d.id, ...d.data() } as TareaPredefinida))
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TareaPredefinida))
}

export const obtenerPiezasPredefinidas = async (
  uid: string
): Promise<PiezaPredefinida[]> => {
  const snap = await getDocs(piezasCol(uid))
  if (snap.empty) {
    await sembrarPiezas(uid)
    const snap2 = await getDocs(piezasCol(uid))
    return snap2.docs.map(d => ({ id: d.id, ...d.data() } as PiezaPredefinida))
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PiezaPredefinida))
}

// ─── ESCRITURA GRANULAR (1 write por operación) ───────────────────────────────

export const crearTarea = async (
  uid: string,
  data: Omit<TareaPredefinida, 'id'>
): Promise<string> => {
  const id = `t_${Date.now()}`
  const payload = sanitizeTareaPayload(data)

  if (!payload.nombre || !payload.tipo || !payload.categoria) {
    throw new Error('Tarea inválida: nombre, tipo y categoría son requeridos.')
  }

  await setDoc(tareaDocRef(uid, id), {
    ...payload,
    creadoEn: serverTimestamp(),
  })
  return id
}

export const actualizarTarea = async (
  uid: string,
  tarea: TareaPredefinida
): Promise<void> => {
  const { id, ...data } = tarea
  const payload = sanitizeTareaPayload(data)

  await setDoc(tareaDocRef(uid, id), {
    ...payload,
    actualizadoEn: serverTimestamp(),
  }, { merge: true })
}

export const eliminarTarea = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(tareaDocRef(uid, id))
}

export const crearPieza = async (
  uid: string,
  data: Omit<PiezaPredefinida, 'id'>
): Promise<string> => {
  const id = `p_${Date.now()}`
  const payload = sanitizePiezaPayload(data)

  if (!payload.nombre || !payload.categoria) {
    throw new Error('Pieza inválida: nombre y categoría son requeridos.')
  }

  await setDoc(piezaDocRef(uid, id), {
    ...payload,
    creadoEn: serverTimestamp(),
  })
  return id
}

export const actualizarPieza = async (
  uid: string,
  pieza: PiezaPredefinida
): Promise<void> => {
  const { id, ...data } = pieza
  const payload = sanitizePiezaPayload(data)

  await setDoc(piezaDocRef(uid, id), {
    ...payload,
    actualizadoEn: serverTimestamp(),
  }, { merge: true })
}

export const eliminarPieza = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(piezaDocRef(uid, id))
}

// ─── MIGRACIÓN AUTOMÁTICA desde formato antiguo ───────────────────────────────

const migrarSiEsNecesario = async (uid: string): Promise<void> => {
  try {
    const configSnap = await getDoc(configDocRef(uid))
    if (!configSnap.exists()) return
    if (configSnap.data()?.migradoV2 === true) return

    const datos = configSnap.data()
    const tareasViejas: TareaPredefinida[] = datos?.tareasPredefinidas ?? []
    const piezasViejas: PiezaPredefinida[] = datos?.piezasPredefinidas ?? []

    // Si no había datos en el formato viejo, solo marcar como migrado
    if (tareasViejas.length === 0 && piezasViejas.length === 0) {
      await setDoc(configDocRef(uid), { migradoV2: true }, { merge: true })
      return
    }

    // Batch para la migración (máximo 500 ops por batch en Firestore)
    const batch = writeBatch(db)

    tareasViejas.forEach(t => {
      batch.set(tareaDocRef(uid, t.id), {
        nombre: t.nombre,
        tipo: t.tipo,
        categoria: t.categoria,
      })
    })

    piezasViejas.forEach(p => {
      batch.set(piezaDocRef(uid, p.id), {
        nombre: p.nombre,
        categoria: p.categoria,
      })
    })

    // Limpiar arrays del doc principal y marcar migración completada
    batch.set(configDocRef(uid), {
      migradoV2: true,
      tareasPredefinidas: [],
      piezasPredefinidas: [],
    }, { merge: true })

    await batch.commit()
    console.info('[Config] Migración a subcollecciones completada.')
  } catch (err) {
    // No bloquear la app si la migración falla — se reintentará en la siguiente carga
    console.warn('[Config] Migración fallida, se reintentará:', err)
  }
}

// ─── SEEDERS de datos por defecto ─────────────────────────────────────────────

const sembrarTareas = async (uid: string): Promise<void> => {
  const batch = writeBatch(db)
  TAREAS_DEFAULT.forEach(t => {
    batch.set(tareaDocRef(uid, t.id), {
      nombre: t.nombre,
      tipo: t.tipo,
      categoria: t.categoria,
    })
  })
  await batch.commit()
}

const sembrarPiezas = async (uid: string): Promise<void> => {
  const batch = writeBatch(db)
  PIEZAS_DEFAULT.forEach(p => {
    batch.set(piezaDocRef(uid, p.id), {
      nombre: p.nombre,
      categoria: p.categoria,
    })
  })
  await batch.commit()
}

// ─── Datos por defecto ────────────────────────────────────────────────────────

const TAREAS_DEFAULT: TareaPredefinida[] = [
  { id: 'def_t1', nombre: 'Limpieza interna del equipo',        tipo: 'preventivo', categoria: 'Limpieza'     },
  { id: 'def_t2', nombre: 'Limpieza de ventiladores',           tipo: 'preventivo', categoria: 'Limpieza'     },
  { id: 'def_t3', nombre: 'Actualización de drivers',           tipo: 'preventivo', categoria: 'Software'     },
  { id: 'def_t4', nombre: 'Diagnóstico de fallas del sistema',  tipo: 'correctivo', categoria: 'Diagnóstico'  },
  { id: 'def_t5', nombre: 'Eliminación de virus y malware',     tipo: 'correctivo', categoria: 'Seguridad'    },
  { id: 'def_t6', nombre: 'Reemplazo de disco duro defectuoso', tipo: 'correctivo', categoria: 'Hardware'     },
]

const PIEZAS_DEFAULT: PiezaPredefinida[] = [
  { id: 'def_p1', nombre: 'Disco Duro SSD',    categoria: 'Almacenamiento' },
  { id: 'def_p2', nombre: 'Memoria RAM',        categoria: 'Memoria'       },
  { id: 'def_p3', nombre: 'Ventilador CPU',     categoria: 'Refrigeración' },
  { id: 'def_p4', nombre: 'Fuente de Poder',    categoria: 'Energía'       },
  { id: 'def_p5', nombre: 'Teclado',            categoria: 'Periféricos'   },
  { id: 'def_p6', nombre: 'Mouse',              categoria: 'Periféricos'   },
]