// hooks/useMultiUser.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { OrdenMantenimiento, Cliente, Negocio } from '@/types/orden';
import { 
  getClientesPorUsuario, 
  getOrdenesPaginadasConFiltro,
  getTodasLasOrdenesConFiltro,
  crearOrdenAtomica,
  getEstadisticasPorUsuario,
  completarOnboarding,
  getOrdenesPaginadas,
  getNegocioPorUsuario
} from '@/lib/multiuser-helpers';

/**
 * ✅ Hook para Clientes
 * Lee de la caché reactiva sincronizada por FirestoreSyncProvider.
 */
export const useClientesUsuario = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useQuery<Cliente[]>({
    queryKey: ['clientes', user?.uid],
    queryFn: () => getClientesPorUsuario(user!.uid),
    enabled: !!user?.uid,
    staleTime: Infinity,
  });

  const refrescarClientes = () => {
    queryClient.invalidateQueries({ queryKey: ['clientes', user?.uid] });
  };

  return { 
    clientes: queryResult.data || [], 
    loading: queryResult.isLoading, 
    error: queryResult.error ? 'Error al cargar los clientes' : null,
    refrescarClientes 
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

      // Crear orden e incrementar contador en un solo paso transaccional
      const { id, idPersonalizado } = await crearOrdenAtomica(ordenBase, userId);

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
