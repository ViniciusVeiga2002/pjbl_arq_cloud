// Tabela de rotas do API Gateway: única porta de entrada pública do sistema.
//
// O navegador chama /api/<prefixo>/<resto>; o gateway descobre, pelo
// prefixo, para qual BACKEND FOR FRONTEND encaminhar. O gateway só conhece
// BFFs — nunca um microsserviço diretamente: os microsserviços são internos
// e só o BFF sabe compô-los. Um futuro app mobile do motorista (planejado)
// entraria aqui como { prefixo: 'mobile', destino: 'bff-mobile' }, sem
// mudar nada no BFF web.
const ROTAS = Object.freeze([
  Object.freeze({ prefixo: 'web', destino: 'bff-web', metodos: Object.freeze(['GET', 'POST', 'PUT', 'DELETE']) }),
]);

function rotas() {
  return ROTAS;
}

// "web/pedidos/PED-1" → { rota: {prefixo:'web',...}, caminhoNoDestino: 'pedidos/PED-1' }
function resolver(caminho = '') {
  const [prefixo, ...resto] = caminho.split('/').filter(Boolean);
  const rota = ROTAS.find((r) => r.prefixo === prefixo);
  if (!rota) return null;
  return { rota, caminhoNoDestino: resto.join('/') };
}

module.exports = { rotas, resolver };
