'use client'

import { useReducer, useEffect, Dispatch, Reducer, useState, useRef } from 'react'

export function usePersistentReducer<S, A>(
  key: string,
  reducer: Reducer<S, A>,
  initialState: S,
  onHydrate?: (savedState: S) => S
): [S, Dispatch<A>, () => void] {
  const augmentedReducer = (state: S, action: any): S => {
    if (action.type === 'HYDRATE') {
      return action.payload
    }
    return reducer(state, action)
  }

  const [state, dispatch] = useReducer(augmentedReducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)
  const skipPersistRef = useRef(false)

  // Cargar estado inicial desde localStorage al montar
  useEffect(() => {
    try {
      const savedStateStr = localStorage.getItem(key)
      if (savedStateStr) {
        let savedState = JSON.parse(savedStateStr)
        if (onHydrate) {
          savedState = onHydrate(savedState)
        }
        dispatch({ type: 'HYDRATE', payload: savedState })
      }
    } catch (error) {
      console.error('Error hydrating state from localStorage:', error)
    } finally {
      setIsHydrated(true)
    }
  }, [key, onHydrate])

  // Guardar estado en localStorage en cada cambio (solo después de haber cargado)
  useEffect(() => {
    if (isHydrated) {
      try {
        if (!skipPersistRef.current) {
          localStorage.setItem(key, JSON.stringify(state))
        }
      } catch (error) {
        console.error('Error saving state to localStorage:', error)
      }
    }
  }, [key, state, isHydrated])

  // Expose a helper to clear persistence and prevent future saves
  const clearPersistence = () => {
    try {
      skipPersistRef.current = true
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Error clearing persistence:', e)
    }
  }

  return [state, dispatch as Dispatch<A>, clearPersistence]
}
