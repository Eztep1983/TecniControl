import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Orden } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";

export function useOrdenesCliente(clienteId: string) {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarOrdenes = useCallback(async () => {
    if (!clienteId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "ordenes"),
        where("userId", "==", user.uid),
        where("cliente.id", "==", clienteId),
        where("tipo", "==", "mantenimiento"),
        orderBy("fechaCreacion", "desc")
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Orden));
      setOrdenes(docs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  return { ordenes, loading, error, refrescar: cargarOrdenes };
}