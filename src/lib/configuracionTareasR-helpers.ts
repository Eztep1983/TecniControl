// lib/configuracion-helpers.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

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

export const guardarTareasPredefinidas = async (userId: string, tareas: TareaPredefinida[]) => {
  try {
    const userConfigRef = doc(db, 'userConfig', userId)
    await setDoc(userConfigRef, { 
      tareasPredefinidas: tareas,
      ultimaActualizacion: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('Error guardando tareas predefinidas:', error)
    throw error
  }
}

export const guardarPiezasPredefinidas = async (userId: string, piezas: PiezaPredefinida[]) => {
  try {
    const userConfigRef = doc(db, 'userConfig', userId)
    await setDoc(userConfigRef, { 
      piezasPredefinidas: piezas,
      ultimaActualizacion: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('Error guardando piezas predefinidas:', error)
    throw error
  }
}

export const obtenerTareasPredefinidas = async (userId: string): Promise<TareaPredefinida[]> => {
  try {
    const userConfigRef = doc(db, 'userConfig', userId)
    const userConfigDoc = await getDoc(userConfigRef)
    
    if (userConfigDoc.exists()) {
      return userConfigDoc.data()?.tareasPredefinidas || []
    }
    
    // Si no existe, retornar tareas por defecto
    return obtenerTareasPorDefecto()
  } catch (error) {
    console.error('Error obteniendo tareas predefinidas:', error)
    return obtenerTareasPorDefecto()
  }
}

export const obtenerPiezasPredefinidas = async (userId: string): Promise<PiezaPredefinida[]> => {
  try {
    const userConfigRef = doc(db, 'userConfig', userId)
    const userConfigDoc = await getDoc(userConfigRef)
    
    if (userConfigDoc.exists()) {
      return userConfigDoc.data()?.piezasPredefinidas || []
    }
    
    // Si no existe, retornar piezas por defecto
    return obtenerPiezasPorDefecto()
  } catch (error) {
    console.error('Error obteniendo piezas predefinidas:', error)
    return obtenerPiezasPorDefecto()
  }
}

const obtenerTareasPorDefecto = (): TareaPredefinida[] => [
  { id: '1', nombre: 'Limpieza interna del equipo', tipo: 'preventivo', categoria: 'Limpieza' },
  { id: '2', nombre: 'Limpieza de ventiladores y disipadores', tipo: 'preventivo', categoria: 'Limpieza' },
  { id: '3', nombre: 'Actualización de drivers y controladores', tipo: 'preventivo', categoria: 'Software' },
  { id: '4', nombre: 'Diagnóstico de fallas del sistema', tipo: 'correctivo', categoria: 'Diagnóstico' },
  { id: '5', nombre: 'Eliminación de virus y malware', tipo: 'correctivo', categoria: 'Seguridad' },
  { id: '6', nombre: 'Reemplazo de disco duro defectuoso', tipo: 'correctivo', categoria: 'Hardware' }
]

const obtenerPiezasPorDefecto = (): PiezaPredefinida[] => [
  { id: '1', nombre: 'Disco Duro SSD', categoria: 'Almacenamiento' },
  { id: '2', nombre: 'Memoria RAM', categoria: 'Memoria' },
  { id: '3', nombre: 'Ventilador CPU', categoria: 'Refrigeración' },
  { id: '4', nombre: 'Fuente de Poder', categoria: 'Energía' },
  { id: '5', nombre: 'Teclado', categoria: 'Periféricos' },
  { id: '6', nombre: 'Mouse', categoria: 'Periféricos' }
]