import type { AuthDeviceInfo } from './types';

export const getDefaultAuthDeviceInfo = (): AuthDeviceInfo => ({
  deviceName: 'mobile-device',
  platform: 'native',
  appVersion: '1.0.0',
});
