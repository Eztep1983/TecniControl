import { describe, it, expect, vi } from 'vitest';
import { 
  encryptString, 
  decryptString, 
  encryptFirestoreEntity, 
  decryptFirestoreEntity,
  CLIENT_SENSITIVE_FIELDS,
  NEGOCIO_SENSITIVE_FIELDS
} from '../src/lib/encryption-utils';

// Mock process.env to ensure predictable test environment
vi.stubEnv('NEXT_PUBLIC_ENCRYPTION_KEY', 'test_key_123');

describe('Encryption Utils - Firestore', () => {
  const userId = 'user_123';

  describe('encryptString and decryptString', () => {
    it('should encrypt a string adding the ENC: prefix', () => {
      const original = '1234567890';
      const encrypted = encryptString(original, userId);
      
      expect(encrypted).not.toBe(original);
      expect(encrypted.startsWith('ENC:')).toBe(true);
    });

    it('should decrypt a previously encrypted string back to original', () => {
      const original = '1234567890';
      const encrypted = encryptString(original, userId);
      const decrypted = decryptString(encrypted, userId);
      
      expect(decrypted).toBe(original);
    });

    it('should NOT encrypt a string that already has ENC: prefix', () => {
      const alreadyEncrypted = 'ENC:some_encrypted_data';
      const result = encryptString(alreadyEncrypted, userId);
      
      expect(result).toBe(alreadyEncrypted);
    });

    it('should return original text if decrypting a string without ENC: prefix (legacy fallback)', () => {
      const legacyData = '1234567890'; // Plain text
      const decrypted = decryptString(legacyData, userId);
      
      expect(decrypted).toBe(legacyData);
    });

    it('should handle undefined/null inputs gracefully', () => {
      expect(encryptString(null as any, userId)).toBe(null);
      expect(encryptString(undefined as any, userId)).toBe(undefined);
      expect(decryptString(null as any, userId)).toBe(null);
      expect(decryptString(undefined as any, userId)).toBe(undefined);
    });
  });

  describe('encryptFirestoreEntity and decryptFirestoreEntity', () => {
    it('should encrypt only sensitive fields of a Cliente object', () => {
      const cliente = {
        id: 'client_1',
        name: 'Juan Perez',
        cedula: '11223344',
        email: 'juan@test.com',
        phone: '3001234567',
        address: 'Calle 123',
        createdAt: '2026-01-01T00:00:00Z', // non-sensitive
        userId: userId
      };

      const encryptedEntity = encryptFirestoreEntity(cliente, userId);

      // Sensitive fields should be encrypted
      CLIENT_SENSITIVE_FIELDS.forEach(field => {
        expect(encryptedEntity[field]).not.toBe(cliente[field as keyof typeof cliente]);
        expect(encryptedEntity[field].startsWith('ENC:')).toBe(true);
      });

      // Non-sensitive fields should remain plain text
      expect(encryptedEntity.id).toBe(cliente.id);
      expect(encryptedEntity.createdAt).toBe(cliente.createdAt);
      expect(encryptedEntity.userId).toBe(cliente.userId);
    });

    it('should decrypt a previously encrypted Cliente object correctly', () => {
      const cliente = {
        id: 'client_1',
        name: 'Juan Perez',
        cedula: '11223344',
        email: 'juan@test.com',
        phone: '3001234567',
        address: 'Calle 123',
        createdAt: '2026-01-01T00:00:00Z',
        userId: userId
      };

      const encryptedEntity = encryptFirestoreEntity(cliente, userId);
      const decryptedEntity = decryptFirestoreEntity(encryptedEntity, userId);

      expect(decryptedEntity).toEqual(cliente);
    });

    it('should encrypt and decrypt sensitive fields of a Negocio object', () => {
      const negocio = {
        id: 'neg_1',
        nombre: 'Mi Empresa',
        direccion: 'Avenida Siempre Viva',
        telefono: '555-1234',
        email: 'contacto@empresa.com',
        nit: '900123456-7',
        logoUrl: 'https://example.com/logo.png', // non-sensitive
        userId: userId
      };

      const encrypted = encryptFirestoreEntity(negocio, userId);
      
      NEGOCIO_SENSITIVE_FIELDS.forEach(field => {
        expect(encrypted[field]).not.toBe(negocio[field as keyof typeof negocio]);
        expect(encrypted[field].startsWith('ENC:')).toBe(true);
      });
      
      expect(encrypted.logoUrl).toBe(negocio.logoUrl);

      const decrypted = decryptFirestoreEntity(encrypted, userId);
      expect(decrypted).toEqual(negocio);
    });

    it('should encrypt the nested cliente inside an Orden object', () => {
      const orden = {
        id: 'orden_1',
        tipoMantenimiento: 'preventivo',
        clienteId: 'client_1',
        observacionesIniciales: 'Falla al encender', // non-sensitive
        cliente: {
          id: 'client_1',
          name: 'Maria Lopez',
          cedula: '55667788',
          phone: '3119876543'
        },
        userId: userId
      };

      const encrypted = encryptFirestoreEntity(orden, userId);

      // Order fields should remain plain
      expect(encrypted.tipoMantenimiento).toBe('preventivo');
      expect(encrypted.observacionesIniciales).toBe('Falla al encender');

      // Nested client fields should be encrypted
      expect(encrypted.cliente.name).not.toBe('Maria Lopez');
      expect(encrypted.cliente.name.startsWith('ENC:')).toBe(true);
      expect(encrypted.cliente.cedula.startsWith('ENC:')).toBe(true);
      expect(encrypted.cliente.phone.startsWith('ENC:')).toBe(true);
      
      // Nested client id should remain plain
      expect(encrypted.cliente.id).toBe('client_1');

      const decrypted = decryptFirestoreEntity(encrypted, userId);
      expect(decrypted).toEqual(orden);
    });

    it('should fallback to plain text if the entity has mixed legacy and encrypted data', () => {
      const orden = {
        tipoMantenimiento: 'preventivo',
        cliente: {
          name: encryptString('Carlos', userId), // Encrypted newly
          cedula: '123456', // Legacy plain text
        }
      };

      const decrypted = decryptFirestoreEntity(orden, userId);
      
      expect(decrypted.cliente.name).toBe('Carlos');
      expect(decrypted.cliente.cedula).toBe('123456');
    });
  });
});
