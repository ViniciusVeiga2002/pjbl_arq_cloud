const verificarPorta = require('./verificarPorta');

// Porta de saída do BFF para o microsserviço de Pedidos. O BFF não sabe se
// o serviço é uma Azure Function, qual é a URL ou como se autentica — isso é
// do adaptador infraestrutura/clientes/ClienteServicoDePedidos.js.
//
// @typedef {Object} PortaServicoDePedidos
// @property {(filtros: object) => Promise<object[]>} pesquisar
// @property {(dados: object) => Promise<object>} cadastrar
// @property {(id: string, dados: object) => Promise<object>} alterar
// @property {(id: string) => Promise<object>} excluir

const exigirServicoDePedidos = (adaptador, metodos) => verificarPorta(adaptador, 'PortaServicoDePedidos', metodos);

module.exports = { exigirServicoDePedidos };
