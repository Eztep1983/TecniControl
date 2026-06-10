// hooks/useNegocio.ts
import { useQuery } from '@tanstack/react-query';
import { Negocio } from '@/types/orden';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useNegocio = () => {
  const { user } = useAuth();

  const { data: negocio = null, isLoading: loading, error } = useQuery<Negocio | null>({
    queryKey: ['negocio', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const negocioRef = doc(db, 'negocios', user.uid);
      const negocioDoc = await getDoc(negocioRef);
      
      if (negocioDoc.exists()) {
        return { id: negocioDoc.id, ...negocioDoc.data() } as Negocio;
      }
      return null;
    },
    enabled: !!user?.uid,
    staleTime: Infinity, // El FirestoreSyncProvider mantiene esto actualizado en tiempo real
  });

  return { negocio, loading, error: error ? (error as Error).message : null };
};