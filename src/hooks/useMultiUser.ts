// hooks/useMultiUser.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from '@/components/providers/OfflineSyncProvider';
import { OrdenMantenimiento, Cliente, Negocio } from '@/types/orden';
import { 
  getClientesPorUsuario, 
  getOrdenesPaginadasConFiltro,
  getTodasLasOrdenesConFiltro,
  crearOrdenAtomica,
  reservarBloqueIds,
  crearOrden,
  getEstadisticasPorUsuario,
  completarOnboarding,
  getOrdenesPaginadas,
  getNegocioPorUsuario,
  crearCliente,
  actualizarCliente
} from '@/lib/multiuser-helpers';
import { obtenerSiguienteIdDePool, saveLocalIdPool } from '@/lib/id-pool-helper';

/**
 * ✅ Hook para Clientes
 * Lee de la caché reactiva sincronizada por FirestoreSyncProvider.
 */
export const useClientesUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { connected } = useNetworkStatus();
  const { enqueueConfig } = useOfflineSync();

  const queryResult = useQuery<Cliente[]>({
    queryKey: ['clientes', user?.uid],
    queryFn: () => getClientesPorUsuario(user!.uid),
    enabled: !!user?.uid,
    staleTime: Infinity,
  });

  const refrescarClientes = () => {
    queryClient.invalidateQueries({ queryKey: ['clientes', user?.uid] });
  };

  // Mutación para crear cliente (online/offline)
  const crearClienteMutation = useMutation({
    mutationFn: async (clienteData: Omit<Cliente, 'id'>) => {
      return crearCliente(clienteData, user!.uid);
    },
    onSuccess: () => {
      refrescarClientes();
    }
  });

  const crearClienteFn = async (clienteData: Omit<Cliente, 'id'>): Promise<string> => {
    const userId = user!.uid;
    const nowStr = new Date().toISOString();
    const clienteConFechas = {
      ...clienteData,
      userId,
      createdAt: (clienteData as any).createdAt || nowStr,
      updatedAt: nowStr
    };

    if (!connected) {
      const tempId = `client_temp_${Date.now()}`;
      const optimista: Cliente = {
        id: tempId,
        ...clienteConFechas
      } as Cliente;

      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['clientes', userId] });
      queryClient.setQueryData<Cliente[]>(['clientes', userId], old =>
        [...(old ?? []), optimista]
      );

      // Encolar offline
      enqueueConfig({
        type: 'create',
        entity: 'cliente',
        payload: { tempId, ...clienteConFechas },
        userId
      });

      return tempId;
    } else {
      const newId = await crearClienteMutation.mutateAsync(clienteConFechas);
      return newId;
    }
  };

  // Mutación para actualizar cliente (online/offline)
  const actualizarClienteMutation = useMutation({
    mutationFn: async ({ id, clienteData }: { id: string; clienteData: Partial<Cliente> }) => {
      await actualizarCliente(id, clienteData, user!.uid);
    },
    onSuccess: () => {
      refrescarClientes();
    }
  });

  const actualizarClienteFn = async (id: string, clienteData: Partial<Cliente>): Promise<void> => {
    const userId = user!.uid;
    const nowStr = new Date().toISOString();
    const payload = {
      ...clienteData,
      updatedAt: nowStr
    };

    if (!connected) {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['clientes', userId] });
      queryClient.setQueryData<Cliente[]>(['clientes', userId], old =>
        (old ?? []).map(c => c.id === id ? { ...c, ...payload } as Cliente : c)
      );

      // Encolar offline
      enqueueConfig({
        type: 'update',
        entity: 'cliente',
        payload: { id, ...payload },
        userId
      });
    } else {
      await actualizarClienteMutation.mutateAsync({ id, clienteData: payload });
    }
  };

  return { 
    clientes: queryResult.data || [], 
    loading: queryResult.isLoading, 
    error: queryResult.error ? 'Error al cargar los clientes' : null,
    refrescarClientes,
    crearCliente: crearClienteFn,
    actualizarCliente: actualizarClienteFn
  };
};

/**
 * ✅ Hook para Órdenes (Dashboard / Recientes)
 */
export const useOrdenesUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useQuery<OrdenMantenimiento[]>({
    queryKey: ['ordenes', user?.uid],
    queryFn: () => getTodasLasOrdenesConFiltro(user!.uid, 'todos') as Promise<OrdenMantenimiento[]>,
    enabled: !!user?.uid,
    staleTime: Infinity,
  });

  const refrescarOrdenes = () => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] });
  };

  return { 
    ordenes: queryResult.data || [], 
    loading: queryResult.isLoading, 
    error: queryResult.error ? 'Error al cargar las órdenes' : null,
    refrescarOrdenes
  };
};

/**
 * ✅ Hook para crear órdenes
 */
export const useCrearOrden = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenData: any) => {
      const userId = user!.uid;
      const ordenBase = {
        ...ordenData,
        userId,
        clienteId: ordenData.cliente?.id || ordenData.clienteId,
        dispositivoId: ordenData.dispositivo?.id || ordenData.dispositivoId,
        tipo: 'mantenimiento' as const,
        fechaCreacion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. Intentar resolver un ID definitivo desde el pool local
      let idPersonalizado = obtenerSiguienteIdDePool(userId);

      if (!idPersonalizado) {
        // Pool vacío o de año anterior, intentar reservar un bloque nuevo
        try {
          const nuevoPool = await reservarBloqueIds(userId, 10);
          saveLocalIdPool(userId, nuevoPool);
          idPersonalizado = obtenerSiguienteIdDePool(userId);
        } catch (error) {
          console.warn('Error reservando bloque de IDs online, usando crearOrdenAtomica como fallback:', error);
        }
      }

      let id = '';
      if (idPersonalizado) {
        // Crear orden directamente sin transacciones individuales
        id = await crearOrden({
          ...ordenBase,
          idPersonalizado
        }, userId);
      } else {
        // Fallback si la transacción del pool falla por red/concurrencia
        const res = await crearOrdenAtomica(ordenBase, userId);
        id = res.id;
        idPersonalizado = res.idPersonalizado;
      }

      return { id, idPersonalizado, isOffline: false, ...ordenBase };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid, 'stats'] });
    },
  });
};

/**
 * ✅ Hook para Negocio
 */
export const useNegocioUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useQuery<Negocio | null>({
    queryKey: ['negocio', user?.uid],
    queryFn: () => getNegocioPorUsuario(user!.uid),
    enabled: !!user?.uid,
    staleTime: Infinity,
  });

  return { 
    negocio: queryResult.data, 
    loading: queryResult.isLoading, 
    error: queryResult.error ? 'Error al cargar el negocio' : null,
    refrescarNegocio: () => queryClient.invalidateQueries({ queryKey: ['negocio', user?.uid] })
  };
};

/**
 * ✅ Hook para Estadísticas
 */
export const useEstadisticasUsuario = () => {
  const { user } = useAuth();

  const { data: estadisticas = {
    totalOrdenes: 0,
    preventivos: 0,
    correctivos: 0,
    diagnosticos: 0,
    instalaciones: 0,
    garantias: 0,
  }, isLoading: loading } = useQuery({
    queryKey: ['ordenes', user?.uid, 'stats'],
    queryFn: () => getEstadisticasPorUsuario(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, 
  });

  return { estadisticas, loading };
};

/**
 * ✅ Hook para Pre-cargar datos
 */
export const usePrefetchData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const prefetchOrdenes = async () => {
    if (!user?.uid) return;
    await queryClient.prefetchQuery({
      queryKey: ['ordenes', user.uid],
      queryFn: () => getTodasLasOrdenesConFiltro(user.uid, 'todos'),
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
 * ✅ Hook para Órdenes Recientes
 */
export const useOrdenesRecientes = (limitCount: number = 5) => {
  const { user } = useAuth();

  return useQuery<OrdenMantenimiento[]>({
    queryKey: ['ordenes', user?.uid, 'recientes', limitCount],
    queryFn: async () => {
      const { ordenes } = await getOrdenesPaginadas(user!.uid, limitCount);
      return ordenes as OrdenMantenimiento[];
    },
    enabled: !!user?.uid,
    staleTime: Infinity,
  });
};

/**
 * ✅ Hook para Órdenes Infinitas
 */
export const useOrdenesInfinitas = (pageSize: number = 10, filtroTipo: string = 'todos') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['ordenes', user?.uid, 'infinito', filtroTipo],
    queryFn: ({ pageParam }) => getOrdenesPaginadasConFiltro(user!.uid, pageSize, pageParam as any, filtroTipo),
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    enabled: !!user?.uid,
    staleTime: 1000 * 60,
  });

  const refrescarOrdenes = () => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] });
  };

  return { ...query, refrescarOrdenes };
};

/**
 * ✅ Hook para Búsqueda
 */
export const useOrdenesBusqueda = (filtroTipo: string = 'todos', enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery<OrdenMantenimiento[]>({
    queryKey: ['ordenes', user?.uid, 'busqueda', filtroTipo],
    queryFn: () => getTodasLasOrdenesConFiltro(user!.uid, filtroTipo) as Promise<OrdenMantenimiento[]>,
    enabled: !!user?.uid && enabled,
    staleTime: Infinity,
  });
};

export const useCompletarOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completarOnboarding(user!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocio', user?.uid] });
    },
  });
};
