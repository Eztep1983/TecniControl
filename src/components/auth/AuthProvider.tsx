// components/auth/AuthProvider.tsx
// Este componente maneja el estado de autenticación del usuario
// y provee métodos para iniciar sesión, cerrar sesión y refrescar la sesión.

'use client'
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
  onIdTokenChanged,
  browserPopupRedirectResolver,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
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
  const lastActivityRef = useRef<number>(Date.now())

  useIsomorphicLayoutEffect(() => {
    // Solo verificamos si hay sesión para propósitos de UI (spinner),
    // pero NO resolvemos loading a false aquí.
    // Dejar loading=true permite que AuthGuard espere a Firebase
    // en lugar de redirigir inmediatamente a /login.
    if (getCachedUid() !== null) {
      logger.log('🔍 Sesión cacheada encontrada, esperando confirmación de Firebase...');
    }
  }, [])

  // ==================== VALIDACIONES ====================

  const validateEmailDomain = (email: string | null): boolean => {
    if (!email || !SECURITY_CONFIG.allowedDomains) return true
    const domain = email.split('@')[1]
    const isAllowed = SECURITY_CONFIG.allowedDomains.includes(domain)
    if (!isAllowed) logger.warn('Email domain not allowed:', domain)
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
          logger.log('New user document created')
        } else {
          await setDoc(userRef, baseData, { merge: true })
          logger.log('User document updated on new login')
        }
      } else {
        // Re-apertura: solo actualizar lastActivity sin leer el doc
        await setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true })
      }
    } catch (error) {
      // Errores de Firestore no deben interrumpir el flujo de auth
      logger.error(' Error syncing user document (non-fatal):', error)
    }
  }, [])

  // ==================== AUTENTICACIÓN ====================

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        logger.log('📱 Capacitor native: usando plugin nativo de Google Sign-In...')
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')

        // Intentar obtener el Web Client ID de las variables de entorno
        // Es CRUCIAL para que funcione en Android y devuelva un idToken
        const webClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;

        const nativeResult = await FirebaseAuthentication.signInWithGoogle({
          skipNativeAuth: false,
        })

        if (!nativeResult.credential?.idToken) {
          throw new Error('No se obtuvo token de Google. Verifica la configuración de SHA-1 en Firebase.')
        }

        const credential = GoogleAuthProvider.credential(
          nativeResult.credential.idToken,
          nativeResult.credential.accessToken ?? undefined
        )
        const result = await signInWithCredential(auth, credential)

        const validation = validateUser(result.user)
        if (!validation.valid) {
          await signOut(auth)
          throw new Error(validation.reason)
        }

        logger.log('✅ Google sign in nativo exitoso:', result.user.uid)
        setCachedUid(result.user.uid)
        syncUserDocument(result.user, true)
        lastActivityRef.current = Date.now()
        setLoading(false)
        return
      }

      // ====== MODO BROWSER (web) ======
      logger.log('🌐 Browser mode: usando signInWithPopup...')
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver)

      const validation = validateUser(result.user)
      if (!validation.valid) {
        await signOut(auth)
        throw new Error(validation.reason)
      }

      logger.log('✅ Google sign in exitoso (popup):', result.user.uid)
      setCachedUid(result.user.uid)
      syncUserDocument(result.user, true)
      lastActivityRef.current = Date.now()
      setLoading(false)
    } catch (error: any) {
      logger.error('❌ Error en sign in:', error)
      throw error
    }
  }

  // ==================== MONITOREO DEL ESTADO ====================

  // NOTA: Con el plugin nativo @capacitor-firebase/authentication NO necesitamos
  // getRedirectResult ni un useEffect especial de redirect, porque el plugin
  // devuelve el token directamente desde la API nativa de Android/iOS.
  // onAuthStateChanged detecta al usuario inmediatamente tras signInWithCredential.

  useEffect(() => {
    logger.log('Setting up auth state listener')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user')

      if (firebaseUser) {
        const validation = validateUser(firebaseUser)
        if (!validation.valid) {
          logger.warn('User validation failed:', validation.reason)
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
        lastActivityRef.current = Date.now()
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
      logger.log('Logging out...')
      // Limpiar caché antes de cerrar sesión
      setCachedUid(null)
      await signOut(auth)
      logger.log('Logout successful')
    } catch (error) {
      logger.error('Error signing out:', error)
      throw new Error('Error al cerrar sesión')
    }
  }

  // ==================== REFRESH SESIÓN ====================

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!user) return
    try {
      logger.log('Refreshing session...')
      await user.reload()
      lastActivityRef.current = Date.now()
      // Actualizar en background
      const userRef = doc(db, 'users', user.uid)
      setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true }).catch(
        (e) => logger.error('Error updating lastActivity:', e)
      )
    } catch (error) {
      logger.error('Error refreshing session:', error)
    }
  }, [user])

  // ==================== MONITOREO DE ACTIVIDAD ====================

  const lastActivityUpdateRef = useRef<number>(Date.now())

  const handleActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityUpdateRef.current > 1000) {
      lastActivityUpdateRef.current = now
      lastActivityRef.current = now
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
      if (Date.now() - lastActivityRef.current >= SECURITY_CONFIG.sessionTimeout) {
        logger.warn(' Session timeout due to inactivity')
        logout()
      }
    }, 60000)
    return () => clearInterval(checkInactivity)
  }, [user])

  // ==================== RENOVACIÓN DE TOKEN ====================

  useEffect(() => {
    logger.log('Setting up token refresh listener')
    const unsubscribe = onIdTokenChanged(auth, async (tokenUser) => {
      if (tokenUser) {
        try {
          const tokenResult = await tokenUser.getIdTokenResult()
          const timeUntilExpiry = new Date(tokenResult.expirationTime).getTime() - Date.now()
          if (timeUntilExpiry < 5 * 60 * 1000) {
            logger.log(' Token about to expire, refreshing...')
            await tokenUser.getIdToken(true)
          }
        } catch (error) {
          logger.error('Error checking token:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // ==================== VALOR DEL CONTEXTO ====================

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    logout,
    refreshSession,
  }), [user, loading, signInWithGoogle, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}