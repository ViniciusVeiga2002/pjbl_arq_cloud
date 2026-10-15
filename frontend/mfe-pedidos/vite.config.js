import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Microfrontend REMOTO "mfePedidos": compilado e versionado de forma
// independente do shell. Expõe uma única tela; tudo o que ela precisa
// (componentes, estilos, acesso ao API Gateway) mora dentro deste projeto.
// "base" coincide com a pasta onde o build é publicado (dist/mfe-pedidos).
export default defineConfig({
  base: '/mfe-pedidos/',
  plugins: [
    react(),
    federation({
      name: 'mfePedidos',
      dts: false,
      filename: 'remoteEntry.js',
      exposes: {
        './TelaPedidos': './src/TelaPedidos.jsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
      },
    }),
  ],
  build: { target: 'esnext' },
});
