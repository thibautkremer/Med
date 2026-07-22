import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thibautkremer.med',
  appName: 'Med',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
