// components/auth/AuthProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult,
  signInWithPopup,
  signOut, 
  GoogleAuthProvider,
  onIdTokenChanged
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// ==================== CONFIGURACIÓN DE SEGURIDAD ====================

const SECURITY_CONFIG = {
  // Dominios de email permitidos (null = todos permitidos)
  allowedDomains: null as string[] | null, // Ejemplo: ['tuempresa.com', 'gmail.com']
  
  // Tiempo máximo de inactividad antes de cerrar sesión (en ms)
  // Ajustado a 30 días pensando en el empaquetado WebView (Capacitor)
  sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 días
  
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
      logger.log('🔐 Starting Google sign in (Popup)...')
      
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'online',
      })
      
      // Restablecemos a Popup, que es 100% estable en navegadores para desarrollo local Web.
      // Cuando empaquetes en Android, este botón deberá llamar al Plugin Nativo de Capacitor en lugar del SDK Web.
      const result = await signInWithPopup(auth, provider);
      
      const validation = validateUser(result.user);
      if (!validation.valid) {
        await signOut(auth);
        throw new Error(validation.reason);
      }
      
      logger.log('✅ Google sign in successful:', result.user.uid);
      await createUserDocument(result.user);
      setLastActivity(Date.now());
      setLoading(false);
      
    } catch (error: any) {
      logger.error('❌ Error initializing sign in:', error)
      throw error
    }
  }

  // ==================== MONITOREO DEL ESTADO ====================

  useEffect(() => {
    let isRedirectPromiseResolved = false;

    // Es crucial esperar o ejecutar en paralelo getRedirectResult
    // para no "mostrar" el login por un segundo si el redirect va a devolver un usuario
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          logger.log('🔥 Redirect result captured:', result.user.uid);
          
          // Forzar la validación y actualización del estado directamente para React
          // esto evita depender 100% del tiempo de reacción de onAuthStateChanged
          const validation = validateUser(result.user);
          if (validation.valid) {
            await createUserDocument(result.user);
            setUser(result.user);
            setLastActivity(Date.now());
            setLoading(false);
          } else {
            logger.warn('🚫 User validation failed after redirect:', validation.reason);
            await signOut(auth);
            setUser(null);
            setLoading(false);
          }
        } else {
          logger.log('ℹ️ No redirect result found (result is null).');
        }
      } catch (error: any) {
        logger.error('❌ Error processing redirect result:', error);
      } finally {
        isRedirectPromiseResolved = true;
        // Si onAuthStateChanged ya se ejecutó y no encontró usuario, destrabamos el loading aquí
        if (auth.currentUser === null) {
          setLoading(false);
        }
      }
    };
    checkRedirectResult();

    logger.log('🔄 Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.log('🔥 Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user');
      
      if (firebaseUser) {
        const validation = validateUser(firebaseUser);
        if (!validation.valid) {
          logger.warn('🚫 User validation failed:', validation.reason);
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        
        try {
          await createUserDocument(firebaseUser);
          setUser(firebaseUser);
          setLastActivity(Date.now());
        } catch (error) {
          logger.error('❌ Error in auth state change:', error);
          await signOut(auth);
          setUser(null);
        }
        
        setLoading(false);
      } else {
        setUser(null);
        if (isRedirectPromiseResolved) {
          setLoading(false);
        }
      }
    });

    return () => {
      logger.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

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