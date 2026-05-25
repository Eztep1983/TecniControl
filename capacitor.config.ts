import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tecnicontrol.app',
  appName: 'TecniControl',
  webDir: 'out',
  /* 
  server: {
    url: 'http://192.168.1.8:9002',
    cleartext: true,
    androidScheme: 'http',
  },
  */
  android: {
    allowMixedContent: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 5000, 
      launchAutoHide: true,     
      backgroundColor: '#ffffffff', 
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,   
      spinnerColor: '#0065a4ff'
    }
  },
};

export default config;
