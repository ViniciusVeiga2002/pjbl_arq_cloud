import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Shell = HOST do Module Federation. Ele não contém nenhuma tela de negócio:
// só sabe ONDE buscar cada microfrontend (remoteEntry.js) e quais
// dependências são compartilhadas. As URLs são relativas porque, publicado,
// tudo é servido pelo mesmo Azure Static Web App (dist/mfe-pedidos/...,
// dist/mfe-frota/...). Em desenvolvimento, o proxy abaixo leva essas
// mesmas URLs aos servidores Vite de cada remoto.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      dts: false,
      remotes: {
        mfePedidos: {
          type: 'module',
          name: 'mfePedidos',
          entry: '/mfe-pedidos/remoteEntry.js',
        },
        mfeFrota: {
          type: 'module',
          name: 'mfeFrota',
          entry: '/mfe-frota/remoteEntry.js',
        },
      },
      // React precisa ser UMA instância só na página (singleton): os remotos
      // usam a cópia carregada pelo shell em vez de trazer a sua.
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
      },
    }),
  ],
  server: {
    proxy: {
      '/mfe-pedidos': 'http://localhost:5174',
      '/mfe-frota': 'http://localhost:5175',
    },
  },
  // O preview serve o pacote já montado (frontend/dist, com os remotos nas
  // subpastas), igual ao Static Web App — sem o proxy de desenvolvimento.
  preview: { proxy: {} },
  build: { target: 'esnext' },
});
