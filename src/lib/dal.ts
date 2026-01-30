// lib/dal.ts - Data Access Layer
// ============================================
import 'server-only'
import { auth } from '@/lib/firebase'

/**
 * Verifica la sesión del usuario y retorna datos seguros
 * Usar en Server Components y Server Actions
 */
export async function getUser() {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      return null
    }
    
    // Retornar solo datos necesarios (DTO pattern)
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Verifica que el usuario tenga un rol específico
 */
export async function verifyRole(requiredRole: string) {
  const user = await getUser()
  if (!user) return false
  
  // Aquí verificarías el rol desde Firestore
  // const userDoc = await db.collection('users').doc(user.uid).get()
  // return userDoc.data()?.role === requiredRole
  
  return true // Placeholder
}
