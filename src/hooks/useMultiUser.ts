// hooks/useMultiUser.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  getClientesPorUsuario, 
  getOrdenesPorUsuario, 
  getOrdenesPaginadas,
  getNegocioPorUsuario,
  crearNegocio 
} from '@/lib/multiuser-helpers';
import { Cliente, Orden, Negocio } from '@/types/orden';

import { 
  obtenerProximoNumeroOrden, 
  formatearIdOrden, 
  validarIdOrdenUnico 
} from '@/lib/firebase-utils';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

export const useClientesUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading: loading, error } = useQuery({
    queryKey: ['clientes', user?.uid],
    queryFn: () => getClientesPorUsuario(user!.uid),
    enabled: !!user?.uid,
  });

  const refrescarClientes = () => {
    queryClient.invalidateQueries({ queryKey: ['clientes', user?.uid] });
  };

  return { clientes, loading, error: error ? 'Error al cargar los clientes' : null, refrescarClientes };
};

export const useOrdenesUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ordenes = [], isLoading: loading, error } = useQuery({
    queryKey: ['ordenes', user?.uid],
    queryFn: () => getOrdenesPorUsuario(user!.uid),
    enabled: !!user?.uid,
  });

  const refrescarOrdenes = () => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] });
  };

  const crearOrdenConsecutiva = async (ordenData: any, userId: string) => {
    try {
      // Obtener el próximo número consecutivo
      const proximoNumero = await obtenerProximoNumeroOrden(ordenData.tipo || 'mantenimiento');
      
      // Formatear el ID
      const idPersonalizado = formatearIdOrden(proximoNumero, ordenData.tipo || 'mantenimiento');
      
      // Verificar que el ID sea único (por seguridad)
      const esUnico = await validarIdOrdenUnico(idPersonalizado);
      if (!esUnico) {
        throw new Error('El ID generado ya existe');
      }

      // Crear la orden con el ID consecutivo
      const ordenCompleta = {
        ...ordenData,
        idPersonalizado,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'ordenes'), ordenCompleta);
      
      // Invalidar TODAS las queries que empiecen con ['ordenes', userId]
      // Esto incluye: lista completa, recientes e infinitas.
      queryClient.invalidateQueries({ queryKey: ['ordenes', userId] });
      
      return { id: docRef.id, idPersonalizado };
    } catch (error) {
      console.error('Error creando orden:', error);
      throw error;
    }
  };

  return {
     ordenes, loading, error: error ? 'Error al cargar las órdenes' : null, refrescarOrdenes, crearOrdenConsecutiva
  };
};

/**
 * Hook para crear órdenes con actualizaciones optimistas (Fase 4)
 */
export const useCrearOrden = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenData: any) => {
      const proximoNumero = await obtenerProximoNumeroOrden(ordenData.tipo || 'mantenimiento');
      const idPersonalizado = formatearIdOrden(proximoNumero, ordenData.tipo || 'mantenimiento');
      
      const ordenCompleta = {
        ...ordenData,
        idPersonalizado,
        userId: user!.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'ordenes'), ordenCompleta);
      return { id: docRef.id, ...ordenCompleta };
    },
    onMutate: async (nuevaOrden) => {
      // Cancelar refetches salientes
      await queryClient.cancelQueries({ queryKey: ['ordenes', user?.uid] });

      // Snapshot del valor previo
      const previousRecent = queryClient.getQueryData(['ordenes', user?.uid, 'recientes', 3]);
      
      // Actualización optimista del Dashboard
      if (previousRecent) {
        queryClient.setQueryData(['ordenes', user?.uid, 'recientes', 3], (old: any) => {
          const tempOrden = { 
            ...nuevaOrden, 
            id: 'temp-' + Date.now(), 
            idPersonalizado: '...', 
            fechaCreacion: new Date() 
          };
          return [tempOrden, ...(old || [])].slice(0, 3);
        });
      }

      return { previousRecent };
    },
    onError: (err, nuevaOrden, context) => {
      // Revertir si hay error
      if (context?.previousRecent) {
        queryClient.setQueryData(['ordenes', user?.uid, 'recientes', 3], context.previousRecent);
      }
    },
    onSettled: () => {
      // Invalidar para sincronizar con el servidor
      queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] });
    },
  });
};

/**
 * Hook para obtener datos del negocio del usuario
 */
export const useNegocioUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: negocio = null, isLoading: loading, error } = useQuery({
    queryKey: ['negocio', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      let negocioData = await getNegocioPorUsuario(user.uid);
      
      // Si no existe el negocio, crear uno por defecto
      if (!negocioData) {
        const negocioDefault = {
          userId: user.uid,
          nombre: user.displayName || 'Mi Negocio',
          direccion: '',
          telefono: '',
          email: user.email || '',
          nit: '',
          logoUrl: ''
        };
        
        await crearNegocio(negocioDefault, user.uid);
        negocioData = await getNegocioPorUsuario(user.uid);
      }
      return negocioData;
    },
    enabled: !!user?.uid,
  });

  const refrescarNegocio = () => {
    queryClient.invalidateQueries({ queryKey: ['negocio', user?.uid] });
  };

  return { negocio, loading, error: error ? 'Error al cargar los datos del negocio' : null, refrescarNegocio };
};

// Hook combinado para obtener estadísticas del usuario
export const useEstadisticasUsuario = () => {
  const { user } = useAuth();

  // Reutilizamos las queries existentes (TanStack Query las deduplicará)
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', user?.uid],
    queryFn: () => getClientesPorUsuario(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: ordenes = [], isLoading: loading } = useQuery({
    queryKey: ['ordenes', user?.uid],
    queryFn: () => getOrdenesPorUsuario(user!.uid),
    enabled: !!user?.uid,
  });

  // Calcular estadísticas de forma reactiva
  const estadisticas = {
    totalClientes: clientes.length,
    totalOrdenes: ordenes.length,
    preventivos: ordenes.filter(o => (o as any).tipoMantenimiento === 'preventivo').length,
    correctivos: ordenes.filter(o => (o as any).tipoMantenimiento === 'correctivo').length,
    diagnosticos: ordenes.filter(o => (o as any).tipoMantenimiento === 'diagnostico').length,
    instalaciones: ordenes.filter(o => (o as any).tipoMantenimiento === 'instalacion').length,
  };

  return { estadisticas, loading };
};

/**
 * Hook para pre-cargar datos (Prefetching - Fase 4)
 */
export const usePrefetchData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const prefetchOrdenes = async () => {
    if (!user?.uid) return;
    await queryClient.prefetchQuery({
      queryKey: ['ordenes', user.uid, 'recientes', 3],
      queryFn: async () => {
        const { ordenes } = await getOrdenesPaginadas(user.uid, 3);
        return ordenes;
      },
    });
  };

  const prefetchClientes = async () => {
    if (!user?.uid) return;
    await queryClient.prefetchQuery({
      queryKey: ['clientes', user.uid],
      queryFn: () => getClientesPorUsuario(user.uid),
    });
  };

  return { prefetchOrdenes, prefetchClientes };
};

/**
 * Hook para obtener solo las órdenes más recientes (optimización para dashboard)
 */
export const useOrdenesRecientes = (limitCount: number = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ordenes', user?.uid, 'recientes', limitCount],
    queryFn: async () => {
      const { ordenes } = await getOrdenesPaginadas(user!.uid, limitCount);
      return ordenes;
    },
    enabled: !!user?.uid,
  });
};

/**
 * Hook para obtener órdenes con paginación infinita
 */
export const useOrdenesInfinitas = (pageSize: number = 10) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['ordenes', user?.uid, 'infinito'],
    queryFn: ({ pageParam }) => getOrdenesPaginadas(user!.uid, pageSize, pageParam as any),
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    enabled: !!user?.uid,
  });

  const refrescarOrdenes = () => {
    // Invalidando la llave raíz ['ordenes', user?.uid], 
    // TanStack Query refresca automáticamente todas las sub-queries 
    // (recientes, infinito, stats).
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] });
  };

  return { ...query, refrescarOrdenes };
};