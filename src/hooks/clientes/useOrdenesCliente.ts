import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Orden } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";

export function useOrdenesCliente(clienteId: string) {
  const { user } = useAuth();

  const { data: ordenes = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['ordenes', user?.uid, 'cliente', clienteId],
    queryFn: async () => {
      if (!clienteId || !user) return [];
      
      const q = query(
        collection(db, "ordenes"),
        where("userId", "==", user.uid),
        where("clienteId", "==", clienteId),
        where("tipo", "==", "mantenimiento"),
        orderBy("fechaCreacion", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Orden));
    },
    enabled: !!clienteId && !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  return { 
    ordenes, 
    loading, 
    error: error ? (error as Error).message : null,
    refrescar: refetch
  };
}