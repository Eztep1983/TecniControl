// tests/config-helpers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  obtenerTareasPredefinidas, 
  obtenerPiezasPredefinidas 
} from '../src/lib/configuracion-helpers';

// ─── Mocks de Firebase / Firestore ───────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  db: { type: 'FirestoreMockInstance' }
}));

const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockCommit = vi.fn();
const mockBatchSet = vi.fn();

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn((dbInstance, ...paths) => ({
      path: paths.join('/'),
      id: paths[paths.length - 1]
    })),
    collection: vi.fn((dbInstance, ...paths) => ({
      path: paths.join('/')
    })),
    getDoc: vi.fn((ref) => mockGetDoc(ref)),
    getDocs: vi.fn((ref) => mockGetDocs(ref)),
    setDoc: vi.fn((ref, data, options) => mockSetDoc(ref, data, options)),
    writeBatch: vi.fn(() => ({
      set: mockBatchSet,
      commit: mockCommit
    })),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP')
  };
});

vi.mock('../src/lib/firestore-sanitizers', () => ({
  sanitizeTareaPayload: vi.fn((payload) => payload),
  sanitizePiezaPayload: vi.fn((payload) => payload)
}));

describe('configuracion-helpers (Inicialización única de Tareas y Repuestos)', () => {
  const uid = 'user_test_999';

  // Base de datos simulada en memoria para los mocks
  let dbState = {
    configExists: false,
    configData: null as any,
    tareas: [] as any[],
    piezas: [] as any[]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset state
    dbState = {
      configExists: false,
      configData: null,
      tareas: [],
      piezas: []
    };

    mockCommit.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    // Mock getDoc dependiente del path
    mockGetDoc.mockImplementation(async (ref) => {
      if (ref.path === `userConfig/${uid}`) {
        return {
          exists: () => dbState.configExists,
          data: () => dbState.configData
        };
      }
      return { exists: () => false, data: () => null };
    });

    // Mock getDocs dependiente del path
    mockGetDocs.mockImplementation(async (ref) => {
      if (ref.path === `userConfig/${uid}/tareas`) {
        return {
          empty: dbState.tareas.length === 0,
          docs: dbState.tareas.map(t => ({
            id: t.id,
            data: () => {
              const { id, ...rest } = t;
              return rest;
            }
          }))
        };
      }
      if (ref.path === `userConfig/${uid}/piezas`) {
        return {
          empty: dbState.piezas.length === 0,
          docs: dbState.piezas.map(p => ({
            id: p.id,
            data: () => {
              const { id, ...rest } = p;
              return rest;
            }
          }))
        };
      }
      return { empty: true, docs: [] };
    });
  });

  describe('obtenerTareasPredefinidas', () => {
    it('debe sembrar tareas y guardar flag "inicializado: true" si la colección está vacía y no ha sido inicializada', async () => {
      // Configurar dbState inicial: vacío y no inicializado
      dbState.configExists = false;
      dbState.configData = null;
      dbState.tareas = [];

      // Interceptar cuando finaliza sembrarTareas simulando que los items fueron escritos
      mockCommit.mockImplementationOnce(async () => {
        dbState.tareas = [
          { id: 'def_t1', nombre: 'Limpieza fusora', tipo: 'preventivo', categoria: 'Limpieza' }
        ];
      });

      const tareas = await obtenerTareasPredefinidas(uid);

      expect(tareas).toHaveLength(1);
      expect(tareas[0].nombre).toBe('Limpieza fusora');

      // Se debió haber realizado la escritura y guardado el flag
      expect(mockCommit).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: `userConfig/${uid}` }),
        { inicializado: true },
        { merge: true }
      );
    });

    it('no debe sembrar tareas si ya está inicializado, incluso si la colección está vacía', async () => {
      // Configurar dbState: ya inicializado y vacío (el usuario eliminó todas las tareas)
      dbState.configExists = true;
      dbState.configData = { inicializado: true, migradoV2: true };
      dbState.tareas = [];

      const tareas = await obtenerTareasPredefinidas(uid);

      // Debe retornar vacío, sin sembrar de nuevo
      expect(tareas).toHaveLength(0);
      expect(mockCommit).not.toHaveBeenCalled();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('obtenerPiezasPredefinidas', () => {
    it('debe sembrar piezas y guardar flag "inicializadoPiezas: true" si la colección está vacía y no ha sido inicializada', async () => {
      dbState.configExists = false;
      dbState.configData = null;
      dbState.piezas = [];

      mockCommit.mockImplementationOnce(async () => {
        dbState.piezas = [
          { id: 'def_p1', nombre: 'Tóner', categoria: 'Consumibles' }
        ];
      });

      const piezas = await obtenerPiezasPredefinidas(uid);

      expect(piezas).toHaveLength(1);
      expect(piezas[0].nombre).toBe('Tóner');

      expect(mockCommit).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: `userConfig/${uid}` }),
        { inicializadoPiezas: true },
        { merge: true }
      );
    });

    it('no debe sembrar piezas si ya está inicializado, incluso si la colección está vacía', async () => {
      dbState.configExists = true;
      dbState.configData = { inicializadoPiezas: true };
      dbState.piezas = [];

      const piezas = await obtenerPiezasPredefinidas(uid);

      expect(piezas).toHaveLength(0);
      expect(mockCommit).not.toHaveBeenCalled();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });
});
