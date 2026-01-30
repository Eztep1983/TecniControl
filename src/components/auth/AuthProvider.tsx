// components/auth/AuthProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  onIdTokenChanged
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// ==================== CONFIGURACIÓN DE SEGURIDAD ====================

const SECURITY_CONFIG = {
  // Dominios de email permitidos (null = todos permitidos)
  allowedDomains: null as string[] | null, // Ejemplo: ['tuempresa.com', 'gmail.com']
  
  // Tiempo máximo de inactividad antes de cerrar sesión (en ms)
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  
  // Habilitar logs en desarrollo
  enableLogs: process.env.NODE_ENV === 'development',
  
  // Validar email verificado
  requireEmailVerification: false,
}

// ==================== UTILIDADES ====================

const logger = {
  log: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.log(...args),
  error: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.error(...args),
  warn: (...args: any[]) => SECURITY_CONFIG.enableLogs && console.warn(...args),
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
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // ==================== VALIDACIONES ====================

  const validateEmailDomain = (email: string | null): boolean => {
    if (!email || !SECURITY_CONFIG.allowedDomains) return true
    
    const domain = email.split('@')[1]
    const isAllowed = SECURITY_CONFIG.allowedDomains.includes(domain)
    
    if (!isAllowed) {
      logger.warn('🚫 Email domain not allowed:', domain)
    }
    
    return isAllowed
  }

  const validateUser = (user: User): { valid: boolean; reason?: string } => {
    // Validar dominio de email
    if (!validateEmailDomain(user.email)) {
      return { 
        valid: false, 
        reason: 'El dominio de tu email no está autorizado para acceder a esta aplicación.' 
      }
    }

    // Validar email verificado (si está habilitado)
    if (SECURITY_CONFIG.requireEmailVerification && !user.emailVerified) {
      return { 
        valid: false, 
        reason: 'Por favor verifica tu email antes de continuar.' 
      }
    }

    return { valid: true }
  }

  // ==================== GESTIÓN DE DOCUMENTOS ====================

  const createUserDocument = async (user: User): Promise<void> => {
    try {
      logger.log('📝 Creating/updating user document:', user.uid)
      
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      const baseData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastLogin: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }

      if (!userDoc.exists()) {
        logger.log('👤 Creating new user document')
        
        const newUserData: UserDocument = {
          uid: user.uid,
          ...baseData,
          role: 'user',
          businessId: user.uid,
          createdAt: serverTimestamp(),
          loginAttempts: 0,
        }
        
        await setDoc(userRef, newUserData)
      } else {
        logger.log('🔄 Updating existing user document')
        
        await setDoc(userRef, baseData, { merge: true })
      }
    } catch (error) {
      logger.error('❌ Error managing user document:', error)
      throw new Error('Error al gestionar datos del usuario')
    }
  }

  // ==================== AUTENTICACIÓN ====================

  const signInWithGoogle = async (): Promise<void> => {
    try {
      logger.log('🔐 Starting Google sign in...')
      
      // Configurar persistencia
      await setPersistence(auth, browserLocalPersistence)
      
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
        // Solicitar solo permisos necesarios
        access_type: 'online',
      })
      
      // Agregar scopes específicos si es necesario
      // provider.addScope('profile')
      // provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      
      // Validar usuario antes de continuar
      const validation = validateUser(result.user)
      if (!validation.valid) {
        await signOut(auth)
        throw new Error(validation.reason)
      }
      
      logger.log('✅ Google sign in successful:', result.user.uid)
      
      await createUserDocument(result.user)
      
      // Actualizar última actividad
      setLastActivity(Date.now())
      
    } catch (error: any) {
      logger.error('❌ Error signing in:', error)
      
      // Mapear errores comunes
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('El inicio de sesión fue cancelado.')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Las ventanas emergentes están bloqueadas. Por favor habilítalas.')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu internet.')
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Dominio no autorizado. Contacta al administrador.')
      }
      
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      logger.log('🚪 Logging out...')
      
      // Actualizar documento antes de cerrar sesión
      if (user) {
        const userRef = doc(db, 'users', user.uid)
        await setDoc(userRef, {
          lastActivity: serverTimestamp(),
        }, { merge: true })
      }
      
      await signOut(auth)
      logger.log(' Logout successful')
    } catch (error) {
      logger.error(' Error signing out:', error)
      throw new Error('Error al cerrar sesión')
    }
  }

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!user) return
    
    try {
      logger.log(' Refreshing session...')
      await user.reload()
      
      // Actualizar última actividad
      setLastActivity(Date.now())
      
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, {
        lastActivity: serverTimestamp(),
      }, { merge: true })
      
    } catch (error) {
      logger.error(' Error refreshing session:', error)
    }
  }, [user])

  // ==================== MONITOREO DE ACTIVIDAD ====================

  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      setLastActivity(Date.now())
    }

    // Escuchar eventos de actividad del usuario
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user])

  // ==================== TIMEOUT DE SESIÓN ====================

  useEffect(() => {
    if (!user) return

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity

      if (inactiveTime >= SECURITY_CONFIG.sessionTimeout) {
        logger.warn(' Session timeout due to inactivity')
        logout()
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(checkInactivity)
  }, [user, lastActivity])

  // ==================== RENOVACIÓN DE TOKEN ====================

  useEffect(() => {
    logger.log('🔄 Setting up token refresh listener')
    
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          // Forzar renovación del token cada 55 minutos (antes de que expire)
          const tokenResult = await user.getIdTokenResult()
          const expirationTime = new Date(tokenResult.expirationTime).getTime()
          const now = Date.now()
          const timeUntilExpiry = expirationTime - now
          
          if (timeUntilExpiry < 5 * 60 * 1000) { // Menos de 5 minutos
            logger.log(' Token about to expire, refreshing...')
            await user.getIdToken(true)
          }
        } catch (error) {
          logger.error(' Error checking token:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // ==================== ESTADO DE AUTENTICACIÓN ====================

  useEffect(() => {
    logger.log('🔄 Setting up auth state listener')
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.log('🔥 Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user')
      
      if (firebaseUser) {
        // Validar usuario
        const validation = validateUser(firebaseUser)
        if (!validation.valid) {
          logger.warn('🚫 User validation failed:', validation.reason)
          await signOut(auth)
          setUser(null)
          setLoading(false)
          return
        }
        
        try {
          await createUserDocument(firebaseUser)
          setUser(firebaseUser)
          setLastActivity(Date.now())
        } catch (error) {
          logger.error('❌ Error in auth state change:', error)
          await signOut(auth)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      logger.log('🧹 Cleaning up auth listener')
      unsubscribe()
    }
  }, [])

  // ==================== VALOR DEL CONTEXTO ====================

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    logout,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}