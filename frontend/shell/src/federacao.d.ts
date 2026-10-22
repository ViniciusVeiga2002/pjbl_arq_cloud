// Tipos dos módulos EXPOSTOS pelos remotos. O shell não importa o código dos
// remotos: estes endereços são resolvidos em tempo de execução pelo Module
// Federation, então o TypeScript só precisa conhecer o formato de cada um.
declare module 'mfePedidos/TelaPedidos' {
  import type { ComponentType } from 'react';
  const TelaPedidos: ComponentType;
  export default TelaPedidos;
}

declare module 'mfeFrota/TelaFrota' {
  import type { ComponentType } from 'react';
  const TelaFrota: ComponentType;
  export default TelaFrota;
}
