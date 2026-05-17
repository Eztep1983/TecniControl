// components/auth/AuthProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
} from 'firebase/auth'

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
// cada ~55 min sin que lo manejemos manualmente. El listener anterior disparaba
// getIdToken(true) lo cual causaba setState y re-renders innecesarios.
import { Capacitor } from '@capacitor/core'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const SECURITY_CONFIG = {
  allowedDomains: null as string[] | null,
  sessionTimeout: 30 * 24 * 60 * 60 * 1000,
  enableLogs: process.env.NODE_ENV === 'development',
  requireEmailVerification: false,
}

const SESSION_CACHE_KEY = 'tc_session_uid'

const logger = {
  log: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.log(...args),
  error: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.error(...args),
  warn: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.warn(...args),
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

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

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const lastActivityRef = useRef<number>(Date.now())

  useIsomorphicLayoutEffect(() => {
    if (getCachedUid() !== null) {
      logger.log('🔍 Sesión cacheada encontrada, esperando confirmación de Firebase...')
    }
  }, [])

  const validateEmailDomain = useCallback((email: string | null): boolean => {
    if (!email || !SECURITY_CONFIG.allowedDomains) return true
    const domain = email.split('@')[1]
    const isAllowed = SECURITY_CONFIG.allowedDomains.includes(domain)
    if (!isAllowed) logger.warn('Email domain not allowed:', domain)
    return isAllowed
  }, [])

  const validateUser = useCallback((firebaseUser: User): { valid: boolean; reason?: string } => {
    if (!validateEmailDomain(firebaseUser.email)) {
      return { valid: false, reason: 'El dominio de tu email no está autorizado.' }
    }
    if (SECURITY_CONFIG.requireEmailVerification && !firebaseUser.emailVerified) {
      return { valid: false, reason: 'Por favor verifica tu email antes de continuar.' }
    }
    return { valid: true }
  }, [validateEmailDomain])

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
        await setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true })
      }
    } catch (error) {
      logger.error('Error syncing user document (non-fatal):', error)
    }
  }, [])

  // ✅ FIX 2: signInWithGoogle envuelto en useCallback para evitar que se recree
  // en cada render, lo que causaba que todos los consumidores del contexto
  // se re-renderizaran innecesariamente.
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      const isNative = Capacitor.isNativePlatform()

      if (isNative) {
        logger.log('📱 Capacitor native: usando plugin nativo de Google Sign-In...')
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')

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
      logger.error('Error en sign in:', error)
      throw error
    }
  }, [validateUser, syncUserDocument])

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

        const isReopen = getCachedUid() === firebaseUser.uid
        setCachedUid(firebaseUser.uid)
        setUser(firebaseUser)
        lastActivityRef.current = Date.now()
        setLoading(false)

        syncUserDocument(firebaseUser, !isReopen)
      } else {
        setCachedUid(null)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      logger.log('🧹 Cleaning up auth listener')
      unsubscribe()
    }
  }, [validateUser, syncUserDocument])

  // ✅ FIX 3: logout envuelto en useCallback por la misma razón que signInWithGoogle.
  // Sin esto, el objeto `value` del contexto cambia en cada render y todos los
  // componentes que usan useAuth() se vuelven a renderizar.
  const logout = useCallback(async (): Promise<void> => {
    try {
      logger.log('Logging out...')
      setCachedUid(null)
      await signOut(auth)
      logger.log('Logout successful')
    } catch (error) {
      logger.error('Error signing out:', error)
      throw new Error('Error al cerrar sesión')
    }
  }, [])

  const refreshSession = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    try {
      logger.log('Refreshing session...')
      await currentUser.reload()
      lastActivityRef.current = Date.now()
      const userRef = doc(db, 'users', currentUser.uid)
      setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true }).catch(
        (e) => logger.error('Error updating lastActivity:', e)
      )
    } catch (error) {
      logger.error('Error refreshing session:', error)
    }
  }, [])

  const lastActivityUpdateRef = useRef<number>(Date.now())

  const handleActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityUpdateRef.current > 1000) {
      lastActivityUpdateRef.current = now
      lastActivityRef.current = now
    }
  }, [])

    useEffect(() => {
    // Solo en dispositivo nativo, solo una vez al montar
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '820146318318-i0r92a8u43998502017o813b6o364o2f.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      })
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))
    return () => events.forEach((event) => window.removeEventListener(event, handleActivity))
  }, [user, handleActivity])

  useEffect(() => {
    if (!user) return
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SECURITY_CONFIG.sessionTimeout) {
        logger.warn('Session timeout due to inactivity')
        logout()
      }
    }, 60000)
    return () => clearInterval(checkInactivity)
  }, [user, logout])

  // ✅ FIX 1 cont.: Eliminado el useEffect de onIdTokenChanged completamente.
  // Firebase renueva el token automáticamente. Si necesitas el token actualizado,
  // usa await user.getIdToken() directamente donde lo necesites.

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    logout,
    refreshSession,
  }), [user, loading, signInWithGoogle, logout, refreshSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}