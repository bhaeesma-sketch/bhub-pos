import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhub.pos',
  appName: 'B-HUB POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
