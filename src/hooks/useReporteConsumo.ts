import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { readOfflineQueue } from "@/lib/offline-queue-helpers";
import { deserializeOrdenPayload } from "@/lib/orden-serializer";
import type { OrdenMantenimiento } from "@/types/orden";

export interface ConsumoPieza {
  pieza: string;
  cantidad: number;
}

export type FiltroTiempo = "all" | "mes_actual" | "mes_pasado" | "ultimos_30";

export function useReporteConsumo(filtro: FiltroTiempo = "all") {
  const { user } = useAuth();

  const { data: consumos = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['reporte_consumo', user?.uid, filtro],
    queryFn: async () => {
      if (!user) return [];

      let firestoreOrdenes: OrdenMantenimiento[] = [];
      try {
        const q = query(
          collection(db, "ordenes"),
          where("userId", "==", user.uid),
          where("tipo", "==", "mantenimiento")
        );
        const snapshot = await getDocs(q);
        firestoreOrdenes = snapshot.docs.map((doc) => doc.data() as OrdenMantenimiento);
      } catch (err) {
        console.error("Error fetching firestore orders for reports:", err);
      }

      let offlineOrdenes: OrdenMantenimiento[] = [];
      try {
        const queue = readOfflineQueue(user.uid);
        offlineOrdenes = queue
          .map(item => deserializeOrdenPayload(item.payload) as unknown as OrdenMantenimiento)
          .filter(order => order.tipo === "mantenimiento");
      } catch (err) {
        console.error("Error reading offline queue for reports:", err);
      }

      // Combinar órdenes online y offline
      let combined = [...offlineOrdenes, ...firestoreOrdenes];

      // Filtrar por fecha
      const now = new Date();
      if (filtro !== "all") {
        combined = combined.filter(orden => {
          let orderDate: Date | null = null;
          if (orden.fechaCreacion instanceof Timestamp) {
            orderDate = orden.fechaCreacion.toDate();
          } else if (orden.fechaCreacion instanceof Date) {
            orderDate = orden.fechaCreacion;
          } else if (typeof orden.fechaCreacion === 'string') {
            orderDate = new Date(orden.fechaCreacion);
          } else if (orden.createdAt) {
            orderDate = new Date(orden.createdAt as any);
          }

          if (!orderDate || isNaN(orderDate.getTime())) return true; // Si no hay fecha, incluimos por defecto (o podríamos excluirlo)

          if (filtro === "mes_actual") {
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
          } else if (filtro === "mes_pasado") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
          } else if (filtro === "ultimos_30") {
            const diffTime = Math.abs(now.getTime() - orderDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            return diffDays <= 30;
          }
          return true;
        });
      }

      // Agregar repuestos
      const mapConsumos = new Map<string, number>();
      
      combined.forEach(orden => {
        if (orden.piezasUsadas && Array.isArray(orden.piezasUsadas)) {
          orden.piezasUsadas.forEach(piezaObj => {
            if (piezaObj.pieza && piezaObj.cantidad) {
              const current = mapConsumos.get(piezaObj.pieza) || 0;
              mapConsumos.set(piezaObj.pieza, current + piezaObj.cantidad);
            }
          });
        }
      });

      const resultado: ConsumoPieza[] = Array.from(mapConsumos.entries()).map(([pieza, cantidad]) => ({
        pieza,
        cantidad
      }));

      // Ordenar de mayor a menor cantidad
      resultado.sort((a, b) => b.cantidad - a.cantidad);

      return resultado;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  return {
    consumos,
    loading,
    error: error ? (error as Error).message : null,
    refrescar: refetch
  };
}
