import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'

export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Date
  lastLogin: Date
  role: 'user' | 'admin'
  businessId: string
}

export const useUserData = () => {
  const { user } = useAuth()

  const { data: userData, isLoading: loading, error } = useQuery({
    queryKey: ['userData', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null
      
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData
      }
      return null
    },
    enabled: !!user?.uid,
  })

  return { userData, loading, error }
}


