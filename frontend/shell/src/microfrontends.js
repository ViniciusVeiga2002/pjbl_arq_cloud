import { lazy } from 'react';

// Registro dos microfrontends que o shell sabe montar. Cada entrada aponta
// para um módulo EXPOSTO por um remoto ("mfePedidos/TelaPedidos"), resolvido
// em tempo de execução pelo Module Federation — o shell nunca importa o
// código-fonte de um remoto. Adicionar uma tela nova = publicar um novo
// remoto e acrescentar uma linha aqui.
export const MICROFRONTENDS = [
  {
    chave: 'frota',
    titulo: 'Mapa da frota',
    equipe: 'mfe-frota',
    Componente: lazy(() => import('mfeFrota/TelaFrota')),
  },
  {
    chave: 'pedidos',
    titulo: 'Pedidos por entrega',
    equipe: 'mfe-pedidos',
    Componente: lazy(() => import('mfePedidos/TelaPedidos')),
  },
];
