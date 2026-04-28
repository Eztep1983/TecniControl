// components/auth/AuthProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onIdTokenChanged,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// ==================== CONFIGURACIÓN DE SEGURIDAD ====================

const SECURITY_CONFIG = {
  allowedDomains: null as string[] | null,
  sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 días
  enableLogs: process.env.NODE_ENV === 'development',
  requireEmailVerification: false,
}

// Clave para caché de sesión en localStorage
const SESSION_CACHE_KEY = 'tc_session_uid'

// ==================== UTILIDADES ====================

const logger = {
  log: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.log(...args),
  error: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.error(...args),
  warn: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.warn(...args),
}

/**
 * useLayoutEffect corre en el cliente sincrónicamente ANTES del primer paint.
 * En el servidor (SSR/Node.js) no existe el DOM, así que usamos useEffect
 * como fallback — pero en la práctica el efecto que nos importa es el del cliente.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Lee el UID cacheado del localStorage de forma segura (SSR-safe).
 * Si existe, significa que el usuario había iniciado sesión previamente.
 */
const getCachedUid = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(SESSION_CACHE_KEY)
  } catch {
    return null
  }
}

const setCachedUid = (uid: string | null) => {
  if (typeof window === 'undefined') return
  try {
    if (uid) {
      localStorage.setItem(SESSION_CACHE_KEY, uid)
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY)
    }
  } catch {
    // ignore
  }
}

// ==================== TIPOS ====================

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

interface UserDocument {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: 'user' | 'admin'
  businessId: string
  createdAt: any
  lastLogin: any
  emailVerified: boolean
  loginAttempts?: number
  lastActivity?: any
}

// ==================== CONTEXTO ====================

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// ==================== PROVIDER ====================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  /**
   * OPTIMIZACIÓN CLAVE — por qué useIsomorphicLayoutEffect y no useState(localStorage):
   *
   * Next.js renderiza este componente en el SERVIDOR antes de enviarlo al cliente.
   * En el servidor, window === undefined → getCachedUid() siempre retorna null →
   * useState(!hasCachedSession) siempre sería useState(true), aunque localStorage
   * tenga el UID cacheado. El cliente hidrata partiendo del estado del servidor,
   * así que loading quedaría en `true` ignorando el caché.
   *
   * useLayoutEffect (via useIsomorphicLayoutEffect) se ejecuta SOLO en el cliente,
   * sincrónicamente ANTES del primer paint del navegador. Esto permite:
   * 1. SSR seguro: loading arranca en true (correcto para servidor).
   * 2. Cliente con sesión: loading se resuelve a false ANTES de que el usuario
   *    vea cualquier pixel → cero spinner en re-apertura (web móvil + Capacitor).
   * 3. Cliente sin sesión: loading permanece true hasta que Firebase resuelve.
   */
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  useIsomorphicLayoutEffect(() => {
    if (getCachedUid() !== null) {
      // Sesión cacheada: resolver loading ANTES del primer paint
      setLoading(false)
    }
  }, [])

  // ==================== VALIDACIONES ====================

  const validateEmailDomain = (email: string | null): boolean => {
    if (!email || !SECURITY_CONFIG.allowedDomains) return true
    const domain = email.split('@')[1]
    const isAllowed = SECURITY_CONFIG.allowedDomains.includes(domain)
    if (!isAllowed) logger.warn('🚫 Email domain not allowed:', domain)
    return isAllowed
  }

  const validateUser = (firebaseUser: User): { valid: boolean; reason?: string } => {
    if (!validateEmailDomain(firebaseUser.email)) {
      return { valid: false, reason: 'El dominio de tu email no está autorizado.' }
    }
    if (SECURITY_CONFIG.requireEmailVerification && !firebaseUser.emailVerified) {
      return { valid: false, reason: 'Por favor verifica tu email antes de continuar.' }
    }
    return { valid: true }
  }

  // ==================== GESTIÓN DE DOCUMENTOS (DIFERIDA / NO BLOQUEANTE) ====================

  /**
   * Actualiza el documento del usuario en Firestore en background.
   * NO bloquea el estado de loading — se ejecuta de forma asíncrona.
   */
  const syncUserDocument = useCallback(async (firebaseUser: User, isNewLogin: boolean): Promise<void> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid)

      const baseData = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        lastLogin: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }

      if (isNewLogin) {
        // Solo verificar si existe el doc cuando es un nuevo login
        const userDoc = await getDoc(userRef)
        if (!userDoc.exists()) {
          const newUserData: UserDocument = {
            uid: firebaseUser.uid,
            ...baseData,
            role: 'user',
            businessId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            loginAttempts: 0,
          }
          await setDoc(userRef, newUserData)
          logger.log('👤 New user document created')
        } else {
          await setDoc(userRef, baseData, { merge: true })
          logger.log('🔄 User document updated on new login')
        }
      } else {
        // Re-apertura: solo actualizar lastActivity sin leer el doc
        await setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true })
      }
    } catch (error) {
      // Errores de Firestore no deben interrumpir el flujo de auth
      logger.error('❌ Error syncing user document (non-fatal):', error)
    }
  }, [])

  // ==================== AUTENTICACIÓN ====================

  const signInWithGoogle = async (): Promise<void> => {
    try {
      logger.log('🔐 Starting Google sign in (Popup)...')
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'online',
      })

      const result = await signInWithPopup(auth, provider)

      const validation = validateUser(result.user)
      if (!validation.valid) {
        await signOut(auth)
        throw new Error(validation.reason)
      }

      logger.log('✅ Google sign in successful:', result.user.uid)
      // Cachear sesión inmediatamente
      setCachedUid(result.user.uid)
      // Sincronizar documento en background (nuevo login)
      syncUserDocument(result.user, true)
      setLastActivity(Date.now())
      setLoading(false)
    } catch (error: any) {
      logger.error('❌ Error initializing sign in:', error)
      throw error
    }
  }

  // ==================== MONITOREO DEL ESTADO ====================

  useEffect(() => {
    logger.log('🔄 Setting up auth state listener')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.log('🔥 Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user')

      if (firebaseUser) {
        const validation = validateUser(firebaseUser)
        if (!validation.valid) {
          logger.warn('🚫 User validation failed:', validation.reason)
          setCachedUid(null)
          await signOut(auth)
          setUser(null)
          setLoading(false)
          return
        }

        // Cachear el UID para la próxima apertura
        const isReopen = getCachedUid() === firebaseUser.uid
        setCachedUid(firebaseUser.uid)
        setUser(firebaseUser)
        setLastActivity(Date.now())
        setLoading(false)

        // Sincronizar Firestore en background sin bloquear la UI
        syncUserDocument(firebaseUser, !isReopen)
      } else {
        // Sin usuario: limpiar caché y resolver loading
        setCachedUid(null)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      logger.log('🧹 Cleaning up auth listener')
      unsubscribe()
    }
  }, [syncUserDocument])

  // ==================== LOGOUT ====================

  const logout = async (): Promise<void> => {
    try {
      logger.log('🚪 Logging out...')
      // Limpiar caché antes de cerrar sesión
      setCachedUid(null)
      await signOut(auth)
      logger.log('✅ Logout successful')
    } catch (error) {
      logger.error('❌ Error signing out:', error)
      throw new Error('Error al cerrar sesión')
    }
  }

  // ==================== REFRESH SESIÓN ====================

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!user) return
    try {
      logger.log('🔃 Refreshing session...')
      await user.reload()
      setLastActivity(Date.now())
      // Actualizar en background
      const userRef = doc(db, 'users', user.uid)
      setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true }).catch(
        (e) => logger.error('Error updating lastActivity:', e)
      )
    } catch (error) {
      logger.error('❌ Error refreshing session:', error)
    }
  }, [user])

  // ==================== MONITOREO DE ACTIVIDAD ====================

  const lastActivityUpdateRef = useRef<number>(Date.now())

  const handleActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityUpdateRef.current > 1000) {
      lastActivityUpdateRef.current = now
      setLastActivity(now)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))
    return () => events.forEach((event) => window.removeEventListener(event, handleActivity))
  }, [user, handleActivity])

  // ==================== TIMEOUT DE SESIÓN ====================

  useEffect(() => {
    if (!user) return
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity >= SECURITY_CONFIG.sessionTimeout) {
        logger.warn('⏰ Session timeout due to inactivity')
        logout()
      }
    }, 60000)
    return () => clearInterval(checkInactivity)
  }, [user, lastActivity])

  // ==================== RENOVACIÓN DE TOKEN ====================

  useEffect(() => {
    logger.log('🔄 Setting up token refresh listener')
    const unsubscribe = onIdTokenChanged(auth, async (tokenUser) => {
      if (tokenUser) {
        try {
          const tokenResult = await tokenUser.getIdTokenResult()
          const timeUntilExpiry = new Date(tokenResult.expirationTime).getTime() - Date.now()
          if (timeUntilExpiry < 5 * 60 * 1000) {
            logger.log('🔑 Token about to expire, refreshing...')
            await tokenUser.getIdToken(true)
          }
        } catch (error) {
          logger.error('❌ Error checking token:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // ==================== VALOR DEL CONTEXTO ====================

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    logout,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}