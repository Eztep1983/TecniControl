// tests/offline-clients.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  obtenerIdReal, 
  registrarIdMapeado,
} from '../src/lib/offline-client-helpers';
import { 
  readOfflineQueue, 
  writeOfflineQueue 
} from '../src/lib/offline-queue-helpers';
import { serializeOrden, deserializeOrdenPayload } from '../src/lib/orden-serializer';

// ─── Mocks de Entorno del Navegador (LocalStorage) ───────────────────────────
const store: Record<string, string> = {};

beforeEach(() => {
  // Reset local storage mock store
  for (const key in store) {
    delete store[key];
  }
  vi.clearAllMocks();
});

if (typeof window === 'undefined') {
  global.window = {
    navigator: { onLine: true }
  } as any;
}

global.localStorage = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key in store) {
      delete store[key];
    }
  }),
  length: 0,
  key: vi.fn(() => null),
} as any;

// ─── Mocks de Encriptación ────────────────────────────────────────────────────
vi.mock('../src/lib/encryption-utils', () => ({
  encryptData: vi.fn((data) => JSON.stringify(data)),
  decryptData: vi.fn((cipherText) => {
    try {
      return JSON.parse(cipherText);
    } catch {
      return null;
    }
  })
}));

describe('Offline Clients Mapping & Propagation', () => {
  const userId = 'user_test_123';

  it('debe registrar el mapeo de ID y recuperarlo con obtenerIdReal', () => {
    const tempId = 'client_temp_888';
    const realId = 'client_real_999';

    registrarIdMapeado(userId, tempId, realId);

    const resolved = obtenerIdReal(userId, tempId);
    expect(resolved).toBe(realId);
  });

  it('debe propagar el ID real a las operaciones de actualización en la cola de configuración', () => {
    const tempId = 'client_temp_111';
    const realId = 'client_real_222';

    // Cola de config inicial con una operación de actualización del cliente temporal
    const mockQueue = [
      {
        id: 'op_1',
        type: 'update',
        entity: 'cliente',
        payload: { id: tempId, name: 'Juan Editado' },
        userId,
        timestamp: Date.now(),
        retries: 0
      }
    ];

    // Guardar en localStorage usando el formato encryptado (que en nuestro mock es JSON string)
    localStorage.setItem('tec_offline_queue_config', JSON.stringify(mockQueue));

    registrarIdMapeado(userId, tempId, realId);

    // Leer la cola de config actualizada
    const updatedRaw = localStorage.getItem('tec_offline_queue_config');
    const updatedQueue = JSON.parse(updatedRaw!);

    expect(updatedQueue[0].payload.id).toBe(realId);
  });

  it('debe propagar el ID real a las órdenes pendientes en la cola de órdenes', () => {
    const tempId = 'client_temp_333';
    const realId = 'client_real_444';

    const orderPayload = {
      tipo: 'mantenimiento' as const,
      userId,
      clienteId: tempId,
      dispositivoId: 'device_123',
      cliente: { id: tempId, name: 'Juan', dispositivos: [] } as any,
      dispositivo: { id: 'device_123', tipo: 'impresora', marca: 'HP' },
      tipoMantenimiento: 'preventivo' as const,
      tareasRealizadas: [],
      piezasUsadas: [],
      horaCreacion: '12:00',
      fechaCreacion: '2026-06-13T00:00:00.000Z',
      createdAt: '2026-06-13T00:00:00.000Z',
      updatedAt: '2026-06-13T00:00:00.000Z',
    };

    // Crear item en la cola offline de órdenes
    const mockOrderQueue = [
      {
        queueId: 'oq_1',
        tempId: 'OSER-TEMP-777' as any,
        userId,
        payload: serializeOrden(orderPayload as any, 'OSER-TEMP-777' as any),
        enqueuedAt: Date.now(),
        retries: 0,
        status: 'pending' as const
      }
    ];

    writeOfflineQueue(mockOrderQueue as any, userId);

    // Registrar el mapeo
    registrarIdMapeado(userId, tempId, realId);

    // Leer la cola de órdenes y verificar
    const updatedQueue = readOfflineQueue(userId);
    const orderItem = updatedQueue[0];
    
    // Deserializar para leer campos Date
    const deserialized = deserializeOrdenPayload(orderItem.payload);

    expect(deserialized.clienteId).toBe(realId);
    expect(deserialized.cliente.id).toBe(realId);
  });

  it('debe propagar el ID real a las operaciones de eliminación en la cola de configuración', () => {
    const tempId = 'client_temp_555';
    const realId = 'client_real_666';

    // Cola de config con una operación de eliminación del cliente temporal
    const mockQueue = [
      {
        id: 'op_2',
        type: 'delete',
        entity: 'cliente' as const,
        payload: { id: tempId },
        userId,
        timestamp: Date.now(),
        retries: 0
      }
    ];

    localStorage.setItem('tec_offline_queue_config', JSON.stringify(mockQueue));

    registrarIdMapeado(userId, tempId, realId);

    // Leer la cola de config actualizada
    const updatedRaw = localStorage.getItem('tec_offline_queue_config');
    const updatedQueue = JSON.parse(updatedRaw!);

    expect(updatedQueue[0].payload.id).toBe(realId);
  });

  it('debe simular la coalescencia de una actualización en una creación pendiente', () => {
    const tempId = 'client_temp_777';
    let queue = [
      {
        id: 'op_create',
        type: 'create' as const,
        entity: 'cliente' as const,
        payload: { tempId, name: 'Juan', phone: '123' } as any,
        userId,
        timestamp: Date.now(),
        retries: 0
      }
    ];

    const opUpdate = {
      type: 'update' as const,
      entity: 'cliente' as const,
      payload: { id: tempId, phone: '456', address: 'Calle 1' },
      userId
    };

    const targetId = opUpdate.payload.id;
    let mergedIntoCreate = false;
    queue = queue.map(item => {
      if (item.entity === 'cliente' && item.type === 'create' && item.payload.tempId === targetId) {
        mergedIntoCreate = true;
        return {
          ...item,
          payload: {
            ...item.payload,
            ...opUpdate.payload,
            tempId: targetId
          }
        };
      }
      return item;
    });

    expect(mergedIntoCreate).toBe(true);
    expect(queue.length).toBe(1);
    expect((queue[0].payload as any).name).toBe('Juan');
    expect((queue[0].payload as any).phone).toBe('456');
    expect((queue[0].payload as any).address).toBe('Calle 1');
  });

  it('debe simular la coalescencia de múltiples actualizaciones', () => {
    const clientId = 'client_real_555';
    let queue = [
      {
        id: 'op_update_1',
        type: 'update' as const,
        entity: 'cliente' as const,
        payload: { id: clientId, name: 'Juan original', phone: '123' } as any,
        userId,
        timestamp: Date.now(),
        retries: 0
      }
    ];

    const opUpdate2 = {
      type: 'update' as const,
      entity: 'cliente' as const,
      payload: { id: clientId, phone: '789', address: 'Avenida 2' },
      userId
    };

    const targetId = opUpdate2.payload.id;
    let mergedIntoUpdate = false;
    queue = queue.map(item => {
      if (item.entity === 'cliente' && item.type === 'update' && item.payload.id === targetId) {
        mergedIntoUpdate = true;
        return {
          ...item,
          payload: {
            ...item.payload,
            ...opUpdate2.payload
          }
        };
      }
      return item;
    });

    expect(mergedIntoUpdate).toBe(true);
    expect(queue.length).toBe(1);
    expect((queue[0].payload as any).name).toBe('Juan original');
    expect((queue[0].payload as any).phone).toBe('789');
    expect((queue[0].payload as any).address).toBe('Avenida 2');
  });
});
