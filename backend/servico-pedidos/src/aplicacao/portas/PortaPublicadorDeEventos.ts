// Porta (interface) de saída compartilhada pelos slices que ESCREVEM
// (cadastrar, alterar, excluir): publicar um evento de domínio.
//
// Fica fora de features/ porque é a mesma abstração para os três slices —
// um slice nunca importa outro slice (Vertical Slice), mas todos podem
// depender da camada de aplicação compartilhada. A implementação concreta
// (fila do Azure Storage) mora em
// infraestrutura/mensageria/PublicadorDeEventosEmFila.ts e só é conhecida
// pelo composicao/ContainerDeDependencias.ts (Dependency Inversion).
//
import { EventoDePedido } from '../../dominio/eventos/EventosDePedido';

export interface PortaPublicadorDeEventos {
  publicar(evento: EventoDePedido): Promise<void>;
}

const NOME_METODO = 'publicar';

function verificarImplementacao(adaptador: PortaPublicadorDeEventos): PortaPublicadorDeEventos {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaPublicadorDeEventos (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
