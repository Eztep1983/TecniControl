import { describe, it, expect } from 'vitest';
import { performLocalSearch, paginateLocalOrders, buildSearchableString, removeDiacritics, cleanAlphanumeric, performLocalClientSearch } from '../src/lib/search-helpers';

// Mock data
const mockOrders = [
  {
    id: '1',
    idPersonalizado: 'OSER-2026-000001',
    cliente: { name: 'Juan Pérez', phone: '123-456-7890' },
    dispositivo: { marca: 'Apple', modelo: 'iPhone 13 Pro', numeroSerie: 'SN123' },
    tipoMantenimiento: 'correctivo',
    fechaCreacion: new Date('2026-06-01').getTime(),
  },
  {
    id: '2',
    idPersonalizado: 'OSER-2026-000002',
    cliente: { name: 'Esteban Gómez', phone: '098 765 4321' },
    dispositivo: { marca: 'Samsung', modelo: 'Galaxy S23', numeroSerie: 'SN456' },
    tipoMantenimiento: 'preventivo',
    fechaCreacion: new Date('2026-06-02').getTime(),
  },
  {
    id: '3',
    idPersonalizado: 'OSER-2026-000003',
    cliente: { name: 'María Esteban', phone: '+5555555555' },
    dispositivo: { marca: 'Xiaomi', modelo: 'Poco X3', numeroSerie: 'SN789' },
    tipoMantenimiento: 'garantia',
    fechaCreacion: new Date('2026-06-03').getTime(),
  },
  {
    id: '4',
    idPersonalizado: 'OSER-2026-000004',
    cliente: { name: 'Esteban Martínez', phone: '(111) 222-3333' },
    dispositivo: { marca: 'Apple', modelo: 'iPhone 11', numeroSerie: 'SN000' },
    tipoMantenimiento: 'correctivo',
    fechaCreacion: new Date('2026-06-04').getTime(),
  }
];

describe('Offline Search Helpers', () => {
  describe('Normalization', () => {
    it('removeDiacritics should remove accents', () => {
      expect(removeDiacritics('José Pérez')).toBe('jose perez');
      expect(removeDiacritics('María')).toBe('maria');
    });
    
    it('cleanAlphanumeric should keep only numbers and letters', () => {
      expect(cleanAlphanumeric('123-456-7890')).toBe('1234567890');
      expect(cleanAlphanumeric('(555) 123 4567')).toBe('5551234567');
      expect(cleanAlphanumeric('+1-800-APPLE')).toBe('1800apple');
    });
  });

  describe('buildSearchableString', () => {
    it('should concatenate fields and lowercase them with normalization', () => {
      const text = buildSearchableString(mockOrders[0]);
      expect(text).toContain('oser-2026-000001');
      expect(text).toContain('juan perez'); // Diacritic removed
      expect(text).toContain('apple');
      expect(text).toContain('iphone 13 pro');
      expect(text).toContain('correctivo');
      expect(text).toContain('1234567890'); // Hyphens removed
      expect(text).toContain('sn123');
    });
  });

  describe('performLocalSearch', () => {
    it('should find all matches for exact token (esteban)', () => {
      const results = performLocalSearch(mockOrders, 'esteban');
      // Should find Esteban Gomez, Maria Esteban, Esteban Martinez
      expect(results).toHaveLength(3);
      expect(results.map(r => r.id)).toEqual(expect.arrayContaining(['2', '3', '4']));
    });

    it('should find match for multi-token query (esteban apple)', () => {
      const results = performLocalSearch(mockOrders, 'esteban apple');
      // Only Esteban Martinez has an Apple device
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('4');
    });

    it('should fallback to fuzzy matching for typos (estebn)', () => {
      const results = performLocalSearch(mockOrders, 'estebn');
      expect(results.length).toBeGreaterThan(0);
      // Fuse.js should score "esteban" highly
      expect(results.some(r => r.id === '2' || r.id === '3' || r.id === '4')).toBe(true);
    });

    it('should filter by tipoMantenimiento', () => {
      const results = performLocalSearch(mockOrders, 'esteban', 'preventivo');
      // Only Esteban Gomez is preventivo
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should return all when query is empty but filtered by tipo', () => {
      const results = performLocalSearch(mockOrders, '', 'correctivo');
      // Juan and Esteban Martinez
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toEqual(expect.arrayContaining(['1', '4']));
    });
  });

  describe('performLocalClientSearch', () => {
    it('should normalize and find exact match', () => {
      const clients = [
        { id: '1', name: 'José Pérez', email: 'jose@perez.com', phone: '123-456' },
        { id: '2', name: 'Maria Lopez', email: 'maria@lopez.com', phone: '098-765' }
      ];
      // Searches "jose" against "José"
      const results = performLocalClientSearch(clients, 'jose');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find phone numbers regardless of hyphens', () => {
      const clients = [
        { id: '1', name: 'Test', phone: '(555) 123-4567' }
      ];
      const results = performLocalClientSearch(clients, '5551234567');
      expect(results).toHaveLength(1);
    });
  });

  describe('paginateLocalOrders', () => {
    it('should return correct page slice', () => {
      const result = paginateLocalOrders(mockOrders, 0, 2);
      expect(result.ordenes).toHaveLength(2);
      expect(result.ordenes[0].id).toBe('1');
      expect(result.ordenes[1].id).toBe('2');
      expect(result.nextPage).toBe(1);
      expect(result.total).toBe(4);
    });

    it('should return null nextPage when on last page', () => {
      const result = paginateLocalOrders(mockOrders, 1, 2);
      expect(result.ordenes).toHaveLength(2);
      expect(result.ordenes[0].id).toBe('3');
      expect(result.ordenes[1].id).toBe('4');
      expect(result.nextPage).toBeNull();
    });

    it('should apply filter before paginating', () => {
      const result = paginateLocalOrders(mockOrders, 0, 2, 'correctivo');
      expect(result.ordenes).toHaveLength(2);
      expect(result.ordenes[0].id).toBe('1');
      expect(result.ordenes[1].id).toBe('4');
      expect(result.total).toBe(2);
    });
  });
});
