// Porta (interface) de saída compartilhada pelos slices que ESCREVEM
// (cadastrar, alterar, excluir): publicar um evento de domínio.
//
// Fica fora de features/ porque é a mesma abstração para os três slices —
// um slice nunca importa outro slice (Vertical Slice), mas todos podem
// depender da camada de aplicação compartilhada. A implementação concreta
// (fila do Azure Storage) mora em
// infraestrutura/mensageria/PublicadorDeEventosEmFila.js e só é conhecida
// pelo composicao/ContainerDeDependencias.js (Dependency Inversion).
//
// @typedef {Object} PortaPublicadorDeEventos
// @property {(evento: { tipo: string, versao: number, ocorridoEm: string, dados: object }) => Promise<void>} publicar

const NOME_METODO = 'publicar';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaPublicadorDeEventos (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
