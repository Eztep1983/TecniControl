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

import Fuse from 'fuse.js';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';

/**
 * ✅ Hook Inteligente para Búsqueda (Opción C)
 */
export const useOrdenesBusqueda = (busqueda: string, filtroTipo: string = 'todos', enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery<OrdenMantenimiento[]>({
    queryKey: ['ordenes', user?.uid, 'busquedaInteligente', busqueda, filtroTipo],
    queryFn: async () => {
      if (!user?.uid || !busqueda.trim()) return [];

      // 1. Descargar el índice comprimido (1 sola lectura)
      const searchIndexRef = doc(db, 'search_indices', user.uid);
      let indexSnap = await getDoc(searchIndexRef);
      
      // AUTO-MIGRACIÓN SILENCIOSA
      // Si el índice no existe (usuario antiguo), lo reconstruimos al vuelo la primera vez.
      if (!indexSnap.exists()) {
        const { rebuildSearchIndex } = await import('@/lib/multiuser-helpers');
        await rebuildSearchIndex(user.uid);
        indexSnap = await getDoc(searchIndexRef);
        if (!indexSnap.exists()) return [];
      }
      
      const indexData = indexSnap.data().ordenes || {};
      const indexArray = Object.entries(indexData).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }));

      // 2. Ejecutar Fuse.js en memoria local
      const fuse = new Fuse(indexArray, {
        keys: ['c', 'd', 'i', 't', 'p', 's'], // cliente, dispositivo, id, tipo, phone, serie
        threshold: 0.3, // 0.0 es coincidencia exacta, 1.0 coincide con todo
        ignoreLocation: true,
      });

      const resultados = fuse.search(busqueda.trim());
      
      // Filtrar por tipo si es necesario
      let idsEncontrados = resultados.map(r => r.item.id);
      if (filtroTipo !== 'todos') {
        idsEncontrados = resultados
          .filter(r => r.item.t === filtroTipo)
          .map(r => r.item.id);
      }

      // Tomar solo los mejores 20 resultados
      idsEncontrados = idsEncontrados.slice(0, 20);

      if (idsEncontrados.length === 0) return [];

      // 3. Descargar los documentos completos de esos 20 IDs (en chunks de 10 por límite de in)
      const ordenesRef = collection(db, 'ordenes');
      const chunks = [];
      for (let i = 0; i < idsEncontrados.length; i += 10) {
        chunks.push(idsEncontrados.slice(i, i + 10));
      }

      let ordenesCompletas: OrdenMantenimiento[] = [];
      for (const chunk of chunks) {
        const q = query(ordenesRef, where(documentId(), 'in', chunk));
        const snap = await getDocs(q);
        ordenesCompletas = [
          ...ordenesCompletas,
          ...snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrdenMantenimiento))
        ];
      }

      // Mantener el orden de relevancia de Fuse
      ordenesCompletas.sort((a, b) => idsEncontrados.indexOf(a.id!) - idsEncontrados.indexOf(b.id!));

      return ordenesCompletas;
    },
    enabled: !!user?.uid && enabled && busqueda.trim().length > 0,
    staleTime: 1000 * 60 * 5, // Cache local por 5 minutos
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
