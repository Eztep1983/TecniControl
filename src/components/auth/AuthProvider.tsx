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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'

import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'
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
  userProfile: UserDocument | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
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
  deviceId?: string
  plan: 'free' | 'pro'
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  sendPasswordReset: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  clearError: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const clearError = useCallback(() => setError(null), [])

  useIsomorphicLayoutEffect(() => {
    if (getCachedUid() !== null) {
      logger.log(' Sesión cacheada encontrada, esperando confirmación de Firebase...')
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

  const syncUserDocument = useCallback(async (firebaseUser: User, isNewLogin: boolean): Promise<UserDocument> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid)
    
      // Obtener el ID del dispositivo si estamos en una plataforma nativa
      let currentDeviceId = 'web-browser'
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getId()
        currentDeviceId = info.identifier
      }

      const baseData = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        lastLogin: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }

      let userDoc;
      try {
        userDoc = await getDoc(userRef)
      } catch (firestoreErr: any) {
        console.error('❌ Error crítico al consultar Firestore:', firestoreErr)
        if (firestoreErr.code === 'permission-denied') {
          throw new Error('ERROR_DE_PERMISOS: El usuario no tiene permiso para leer su propio perfil.')
        }
        throw firestoreErr
      }
      
      if (!userDoc.exists()) {
        logger.log('Nuevo usuario detectado: creando perfil básico en Firestore:', firebaseUser.uid)

        const createData: any = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          role: 'user',
          businessId: '',
          plan: 'free',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastActivity: serverTimestamp(),
        }

        if (Capacitor.isNativePlatform()) {
          createData.deviceId = currentDeviceId
        }

        await setDoc(userRef, createData, { merge: true })
        logger.log('Perfil de usuario creado para nuevo usuario')
        return { ...createData, plan: 'free' } as UserDocument
      }

      const userData = userDoc.data() as UserDocument

      if (Capacitor.isNativePlatform() && userData.deviceId && userData.deviceId !== currentDeviceId) {
        logger.warn('Device mismatch detected!', { stored: userData.deviceId, current: currentDeviceId })
        throw new Error('DEVICE_LOCKED')
      }

      const updateData: any = {
        ...baseData,
        lastLogin: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }

      if (!userData.deviceId && Capacitor.isNativePlatform()) {
        updateData.deviceId = currentDeviceId
        logger.log('Binding device for newly authorized user:', currentDeviceId)
      }

      if (isNewLogin) {
        await setDoc(userRef, updateData, { merge: true })
        logger.log('User document updated on login')
      } else {
        await setDoc(userRef, { lastActivity: serverTimestamp() }, { merge: true })
      }
      return { ...userData, ...updateData, plan: userData.plan || 'free' } as UserDocument
    } catch (error: any) {
      logger.error('Error syncing user document:', error)
      throw error
    }
  }, [])

  // ✅ FIX 2: signInWithGoogle envuelto en useCallback para evitar que se recree
  // en cada render, lo que causaba que todos los consumidores del contexto
  // se re-renderizaran innecesariamente.
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      const isNative = Capacitor.isNativePlatform()

      if (isNative) {
        logger.log('Capacitor native: usando plugin nativo de Google Sign-In...')
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

        await syncUserDocument(result.user, true)
        
        logger.log('✅ Google sign in nativo exitoso:', result.user.uid)
        setCachedUid(result.user.uid)
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

      await syncUserDocument(result.user, true)

      logger.log('✅ Google sign in exitoso (popup):', result.user.uid)
      setCachedUid(result.user.uid)
      lastActivityRef.current = Date.now()
      setLoading(false)
    } catch (error: any) {
      logger.error('Error en sign in:', error)
      throw error
    }
  }, [validateUser, syncUserDocument])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)

      const validation = validateUser(result.user)
      if (!validation.valid) {
        await signOut(auth)
        throw new Error(validation.reason)
      }

      await syncUserDocument(result.user, true)

      logger.log('✅ Email sign in exitoso:', result.user.uid)
      setCachedUid(result.user.uid)
      lastActivityRef.current = Date.now()
      setLoading(false)
    } catch (error: any) {
      logger.error('Error en email sign in:', error)
      setLoading(false)
      throw error
    }
  }, [validateUser, syncUserDocument])

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
      logger.log(' Correo de restablecimiento de contraseña enviado a:', email)
    } catch (error: any) {
      logger.error('Error al enviar correo de restablecimiento:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    logger.log('Setting up auth state listener')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const validation = validateUser(firebaseUser)
        if (!validation.valid) {
          logger.warn('User validation failed:', validation.reason)
          setCachedUid(null)
          await signOut(auth)
          setUser(null)
          setError(validation.reason || 'Acceso denegado')
          setLoading(false)
          return
        }

        try {
          const isNewLogin = getCachedUid() !== firebaseUser.uid
          
          // 🔥 DESBLOQUEAR LA UI INMEDIATAMENTE
          setCachedUid(firebaseUser.uid)
          setUser(firebaseUser)
          lastActivityRef.current = Date.now()
          setError(null)
          setLoading(false)

          // ⏳ Tarea pesada de Firestore en segundo plano
          syncUserDocument(firebaseUser, isNewLogin)
            .then(updatedProfile => {
              setUserProfile(updatedProfile)
            })
            .catch(async (err: any) => {
              logger.error('Error in background auth sync:', err)
              // Si falla por seguridad (ej. device locked o permisos), revertir sesión
              if (err.message?.includes('DEVICE_LOCKED') || err.message?.includes('ERROR_DE_PERMISOS')) {
                setCachedUid(null)
                await signOut(auth)
                setUser(null)
                setError(err.message)
              }
            })
        } catch (err: any) {
          logger.error('Error in auth state listener setup:', err)
          setCachedUid(null)
          await signOut(auth)
          setUser(null)
          setError(err.message || 'Error de autorización')
          setLoading(false)
        }
      } else {
        setCachedUid(null)
        setUser(null)
        setUserProfile(null)
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
      setError(null)
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
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    sendPasswordReset,
    logout,
    refreshSession,
    clearError,
  }), [user, userProfile, loading, error, signInWithGoogle, signInWithEmail, sendPasswordReset, logout, refreshSession, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}