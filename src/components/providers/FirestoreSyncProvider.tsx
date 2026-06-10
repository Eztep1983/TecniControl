// src/components/providers/FirestoreSyncProvider.tsx
'use client'

import React, { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc,
  limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * FirestoreSyncProvider: El motor de persistencia absoluta y reactividad.
 * 
 * Este componente establece listeners persistentes (onSnapshot) para las 
 * colecciones críticas del usuario. 
 * 
 * Beneficios:
 * 1. Persistencia absoluta: Los datos están en el cache de React Query 
 *    antes de que el usuario cambie de página.
 * 2. Optimización de costos: Firestore solo cobra por cambios (deltas) 
 *    después de la carga inicial desde el cache local (IndexedDB).
 * 3. Carga instantánea: Al navegar, los componentes leen de React Query 
 *    que ya está sincronizado con el cache de Firestore.
 */
export const FirestoreSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.uid) return

    console.log('--- Iniciando Sincronización Real-Time (Cost-Optimized) ---')

    // 1. Listener de Clientes (Completo)
    const qClientes = query(collection(db, 'clientes'), where('userId', '==', user.uid))
    const unsubClientes = onSnapshot(qClientes, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      queryClient.setQueryData(['clientes', user.uid], data)
    })

    // 2. Listener de Órdenes (Colección Completa - Persistencia Absoluta)
    // Al escuchar la colección completa, garantizamos que cualquier búsqueda o historial
    // cargue al instante desde el cache local sin costo adicional de lectura.
    const qOrdenes = query(
      collection(db, 'ordenes'), 
      where('userId', '==', user.uid), 
      orderBy('fechaCreacion', 'desc')
    )
    const unsubOrdenes = onSnapshot(qOrdenes, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Inyectamos en las diferentes llaves de cache para máxima reactividad
      queryClient.setQueryData(['ordenes', user.uid], data)
      queryClient.setQueryData(['ordenes', user.uid, 'recientes', 20], data.slice(0, 20))
      queryClient.setQueryData(['ordenes', user.uid, 'recientes', 5], data.slice(0, 5))
      queryClient.setQueryData(['ordenes', user.uid, 'recientes', 3], data.slice(0, 3))
      
      // También inyectamos en la búsqueda para que sea instantánea
      queryClient.setQueryData(['ordenes', user.uid, 'busqueda', 'todos'], data)
    })

    // 3. Listener de Perfil de Usuario
    const userRef = doc(db, 'users', user.uid)
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        queryClient.setQueryData(['userData', user.uid], snap.data())
      }
    })

    // 4. Listener de Negocio
    const negocioRef = doc(db, 'negocios', user.uid)
    const unsubNegocio = onSnapshot(negocioRef, (snap) => {
      if (snap.exists()) {
        queryClient.setQueryData(['negocio', user.uid], { id: snap.id, ...snap.data() })
      }
    })

    return () => {
      console.log('--- Limpiando Listeners Real-Time ---')
      unsubClientes()
      unsubOrdenes()
      unsubUser()
      unsubNegocio()
    }
  }, [user?.uid, queryClient])

  return <>{children}</>
}
