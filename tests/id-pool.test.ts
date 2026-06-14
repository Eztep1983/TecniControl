// tests/id-pool.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  formatIdPersonalizado, 
  getLocalIdPool, 
  saveLocalIdPool, 
  clearLocalIdPool, 
  obtenerSiguienteIdDePool 
} from '../src/lib/id-pool-helper';
import { reservarBloqueIds, crearOrdenAtomica } from '../src/lib/multiuser-helpers';

// ─── Mocks de Entorno del Navegador (LocalStorage & Window) ───────────────────
const store: Record<string, string> = {};

beforeEach(() => {
  // Reset local storage mock store
  for (const key in store) {
    delete store[key];
  }
  vi.clearAllMocks();
});

// Mock de global window y localStorage para simular el navegador en Node.js
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

// ─── Mocks de Firebase / Firestore ───────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  db: { type: 'FirestoreMockInstance' }
}));

const mockTransaction = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn()
};

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn((dbInstance, collectionName, id) => ({
      path: `${collectionName}/${id}`,
      id
    })),
    collection: vi.fn((dbInstance, name) => ({ path: name })),
    runTransaction: vi.fn(async (db, updateFunction) => {
      return await updateFunction(mockTransaction);
    })
  };
});

vi.mock('../src/lib/firestore-sanitizers', () => ({
  sanitizeOrdenPayload: vi.fn((payload) => payload)
}));

// ─── Suites de Pruebas ───

describe('id-pool-helper (Pool de IDs Local)', () => {
  const userId = 'user_test_123';

  it('debe dar formato correcto a los IDs personalizados', () => {
    expect(formatIdPersonalizado(2026, 1)).toBe('OSER-2026-000001');
    expect(formatIdPersonalizado(2026, 999999)).toBe('OSER-2026-999999');
    expect(formatIdPersonalizado(2027, 45)).toBe('OSER-2027-000045');
  });

  it('debe retornar null si el pool no existe en localStorage', () => {
    const pool = getLocalIdPool(userId);
    expect(pool).toBeNull();
  });

  it('debe guardar y recuperar el pool local cifrado correctamente', () => {
    const testPool = {
      year: 2026,
      nextAvailable: 1,
      maxAllowed: 10
    };
    saveLocalIdPool(userId, testPool);
    
    const retrieved = getLocalIdPool(userId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.year).toBe(2026);
    expect(retrieved?.nextAvailable).toBe(1);
    expect(retrieved?.maxAllowed).toBe(10);
  });

  it('debe limpiar el pool de localStorage', () => {
    const testPool = {
      year: 2026,
      nextAvailable: 1,
      maxAllowed: 10
    };
    saveLocalIdPool(userId, testPool);
    clearLocalIdPool(userId);

    const retrieved = getLocalIdPool(userId);
    expect(retrieved).toBeNull();
  });

  it('debe consumir IDs consecutivamente del pool local', () => {
    const testPool = {
      year: new Date().getFullYear(),
      nextAvailable: 5,
      maxAllowed: 7
    };
    saveLocalIdPool(userId, testPool);

    const id1 = obtenerSiguienteIdDePool(userId);
    expect(id1).toBe(`OSER-${new Date().getFullYear()}-000005`);

    const id2 = obtenerSiguienteIdDePool(userId);
    expect(id2).toBe(`OSER-${new Date().getFullYear()}-000006`);

    const id3 = obtenerSiguienteIdDePool(userId);
    expect(id3).toBe(`OSER-${new Date().getFullYear()}-000007`);

    // Pool agotado
    const id4 = obtenerSiguienteIdDePool(userId);
    expect(id4).toBeNull();
  });

  it('debe retornar null e invalidar el pool si pertenece a un año diferente', () => {
    const testPool = {
      year: 2025, // Año expirado
      nextAvailable: 1,
      maxAllowed: 10
    };
    saveLocalIdPool(userId, testPool);

    // Debe ser null
    const id = obtenerSiguienteIdDePool(userId);
    expect(id).toBeNull();

    // Debe haberse eliminado de localStorage
    const retrieved = getLocalIdPool(userId);
    expect(retrieved).toBeNull();
  });
});

describe('multiuser-helpers (Reserva de Bloques en Firestore)', () => {
  const userId = 'user_test_456';
  const currentYear = new Date().getFullYear();

  it('debe inicializar el contador anual si el documento no existe', async () => {
    mockTransaction.get.mockResolvedValueOnce({
      exists: () => false,
      data: () => null
    });

    const range = await reservarBloqueIds(userId, 5);
    
    expect(range).toEqual({
      year: currentYear,
      nextAvailable: 1,
      maxAllowed: 5
    });

    // Se debió setear en base de datos
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
      expect.objectContaining({
        userId,
        siguientePorAnio: {
          [currentYear]: 6
        }
      })
    );
  });

  it('debe obtener e incrementar el bloque si el documento ya existe', async () => {
    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        userId,
        siguientePorAnio: {
          [currentYear]: 15
        }
      })
    });

    const range = await reservarBloqueIds(userId, 10);

    expect(range).toEqual({
      year: currentYear,
      nextAvailable: 15,
      maxAllowed: 24
    });

    // Se debió actualizar en base de datos sumando 10
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
      expect.objectContaining({
        siguientePorAnio: {
          [currentYear]: 25
        }
      })
    );
  });
});
