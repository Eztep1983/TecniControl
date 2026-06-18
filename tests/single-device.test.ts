import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLocalDeviceId } from '../src/lib/device-helpers';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor/device', () => ({
  Device: {
    getId: vi.fn(),
  },
}));

describe('device-helpers - getLocalDeviceId', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    
    // Configurar un mock básico para window y localStorage
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      clear: () => { mockStorage = {}; }
    });
  });

  it('debe retornar el identifier si es plataforma nativa (Capacitor)', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Device.getId).mockResolvedValue({ identifier: 'native-id-123' });

    const id = await getLocalDeviceId();

    expect(id).toBe('native-id-123');
    expect(Device.getId).toHaveBeenCalledOnce();
  });

  it('debe retornar un id generado y guardarlo en localStorage si es web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const id = await getLocalDeviceId();

    expect(id).toMatch(/^web-/);
    expect(localStorage.getItem('tc_device_id')).toBe(id);
  });

  it('debe retornar el mismo id del localStorage si ya existe en web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    localStorage.setItem('tc_device_id', 'web-existing-456');

    const id = await getLocalDeviceId();

    expect(id).toBe('web-existing-456');
  });
});
