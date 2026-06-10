import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
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
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        queryClient.setQueryData(['userData', user.uid], snap.data() as UserData)
      }
    }, (err) => {
      console.error('Error en listener de userData:', err)
    })

    return () => unsubscribe()
  }, [user?.uid, queryClient])

  const { data: userData, isLoading: loading, error } = useQuery({
    queryKey: ['userData', user?.uid],
    enabled: !!user?.uid,
    staleTime: Infinity, // Real-time via onSnapshot
  })

  return { userData, loading, error }
}