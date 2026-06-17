import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Orden } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";
import { readOfflineQueue } from "@/lib/offline-queue-helpers";
import { deserializeOrdenPayload } from "@/lib/orden-serializer";

export function useOrdenesCliente(clienteId: string) {
  const { user } = useAuth();

  const { data: ordenes = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['ordenes', user?.uid, 'cliente', clienteId],
    queryFn: async () => {
      if (!clienteId || !user) return [];
      
      let firestoreOrdenes: Orden[] = [];
      try {
        const q = query(
          collection(db, "ordenes"),
          where("userId", "==", user.uid),
          where("clienteId", "==", clienteId),
          where("tipo", "==", "mantenimiento"),
          orderBy("fechaCreacion", "desc")
        );
        const snapshot = await getDocs(q);
        firestoreOrdenes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Orden));
      } catch (err) {
        console.error("Error fetching firestore orders for client:", err);
      }

      // Fetch enqueued offline orders
      let offlineOrdenes: Orden[] = [];
      try {
        const queue = readOfflineQueue(user.uid);
        offlineOrdenes = queue
          .map(item => {
            const payload = deserializeOrdenPayload(item.payload);
            return {
              id: item.queueId,
              ...payload,
              isOfflinePending: true
            } as any;
          })
          .filter(order => order.clienteId === clienteId && order.tipo === "mantenimiento");
      } catch (err) {
        console.error("Error reading offline queue for client:", err);
      }

      // Prepend offline pending orders to online orders
      const combined = [...offlineOrdenes, ...firestoreOrdenes];

      const seen = new Set<string>();
      return combined.filter(o => {
        if (!o.id) return true;
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
    },
    enabled: !!clienteId && !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  return { 
    ordenes, 
    loading, 
    error: error ? (error as Error).message : null,
    refrescar: refetch
  };
}