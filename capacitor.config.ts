import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baccarat.trainer',
  appName: '바카라 딜러 트레이닝',
  webDir: 'out',
  server: {
    url: 'https://baccarat-dealer-trainer.vercel.app',
    cleartext: true
  }
};

export default config;