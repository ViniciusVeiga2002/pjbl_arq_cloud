const verificarPorta = require('./verificarPorta');

// Porta de saída do BFF para o microsserviço de Frota.
//
// @typedef {Object} PortaServicoDeFrota
// @property {(filtros?: object) => Promise<object[]>} listarVeiculos
// @property {(filtros?: object) => Promise<object[]>} listarEntregas

const exigirServicoDeFrota = (adaptador, metodos) => verificarPorta(adaptador, 'PortaServicoDeFrota', metodos);

module.exports = { exigirServicoDeFrota };
