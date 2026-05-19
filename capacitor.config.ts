import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voidmsg.messenger',
  appName: 'VØID',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
  }
};

export default config;
