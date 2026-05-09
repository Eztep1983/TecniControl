import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecnicontrol.app',
  appName: 'TecniControl',
  webDir: 'out',
  server: {
    url: 'http://192.168.20.20:9002',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
};

export default config;
