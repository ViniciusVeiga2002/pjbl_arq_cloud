// Política de CORS centralizada: só o gateway é chamado pelo navegador, então
// só ele precisa responder CORS. Em vez de "*", libera apenas as origens do
// frontend (o Static Web App publicado e os servidores locais do Vite).
const METODOS_PERMITIDOS = 'GET, POST, PUT, DELETE, OPTIONS';
const CABECALHOS_PERMITIDOS = 'content-type, x-correlation-id';

class PoliticaDeCors {
  private readonly origensPermitidas: Set<string>;

  constructor(origensPermitidas: Iterable<string>) {
    this.origensPermitidas = new Set(origensPermitidas);
  }

  permite(origem: string): boolean {
    return this.origensPermitidas.has(origem);
  }

  cabecalhosPara(origem: string | null): Record<string, string> {
    if (!origem || !this.permite(origem)) return {};
    return {
      'access-control-allow-origin': origem,
      'access-control-allow-methods': METODOS_PERMITIDOS,
      'access-control-allow-headers': CABECALHOS_PERMITIDOS,
      'access-control-expose-headers': 'x-correlation-id, x-ratelimit-remaining',
      'access-control-max-age': '600',
      vary: 'Origin',
    };
  }
}

export default PoliticaDeCors;
