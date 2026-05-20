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
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: "820146318318-i0r92a8u43998502017o813b6o364o2f.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
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
