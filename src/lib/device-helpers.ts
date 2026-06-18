import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export const getLocalDeviceId = async (): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    const info = await Device.getId();
    return info.identifier;
  }
  if (typeof window !== 'undefined') {
    let webId = localStorage.getItem('tc_device_id');
    if (!webId) {
      webId = `web-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('tc_device_id', webId);
    }
    return webId;
  }
  return 'unknown-device';
};
