import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Microfrontend REMOTO "mfeFrota": compilado e versionado de forma
// independente do shell e do mfe-pedidos. Expõe o painel da frota.
// "base" coincide com a pasta onde o build é publicado (dist/mfe-frota).
export default defineConfig({
  base: '/mfe-frota/',
  plugins: [
    react(),
    federation({
      name: 'mfeFrota',
      dts: false,
      filename: 'remoteEntry.js',
      exposes: {
        './TelaFrota': './src/TelaFrota.jsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
      },
    }),
  ],
  build: { target: 'esnext' },
});
