import { useEffect, useState } from 'react';
import {
  pesquisarPedidos,
  cadastrarPedido,
  alterarPedido,
  excluirPedido,
  concluirEntrega,
  estaOffline,
} from './services/apiPedidos';
import './pedidos.css';

// Microfrontend "Pedidos por entrega" (persona: Coordenador de Frota,
// RF05/RF07). Módulo EXPOSTO pelo remoto mfePedidos e montado pelo
// shell em tempo de execução.
//
// Todas as operações passam pelo API Gateway → BFF web:
//   pesquisar        -> GET    /api/web/pedidos
//   cadastrar        -> POST   /api/web/pedidos
//   alterar          -> PUT    /api/web/pedidos/{id}
//   excluir          -> DELETE /api/web/pedidos/{id}
//   concluir entrega -> POST   /api/web/entregas/{id}/concluir
const statusClasse = {
  'Em rota': 'status-em-rota',
  Entregue: 'status-entregue',
  Atrasado: 'status-atrasado',
};

const situacaoVeiculo = {
  ok: { texto: 'Normal', classe: 'veiculo-ok' },
  parado: { texto: 'Parado', classe: 'veiculo-parado' },
  'alerta-velocidade': { texto: 'Excesso de velocidade', classe: 'veiculo-alerta' },
};

const STATUS_OPCOES = ['Aguardando coleta', 'Em rota', 'Entregue', 'Atrasado'];

// Evento de navegador combinado com o shell (contrato entre microfrontends).
const EVENTO_ENTREGA_CONCLUIDA = 'pjbl:entrega-concluida';

const PEDIDO_VAZIO = {
  cliente: '',
  entregaId: '',
  veiculoPlaca: '',
  status: 'Aguardando coleta',
  previsaoEntrega: '',
};

function formatarData(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CelulaVeiculo({ pedido }) {
  if (!pedido.veiculoPlaca) return <td>—</td>;
  const situacao = pedido.veiculo && situacaoVeiculo[pedido.veiculo.status];
  return (
    <td>
      <div>{pedido.veiculoPlaca}</div>
      {situacao && (
        <span className={`badge ${situacao.classe}`} title={`${pedido.veiculo.velocidade} km/h`}>
          {situacao.texto}
        </span>
      )}
    </td>
  );
}

export default function TelaPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [offline, setOffline] = useState(false);
  const [concluindo, setConcluindo] = useState(null);

  const [filtroCliente, setFiltroCliente] = useState('');
  const [novoPedido, setNovoPedido] = useState(PEDIDO_VAZIO);
  const [criando, setCriando] = useState(false);

  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [pedidoEditado, setPedidoEditado] = useState(PEDIDO_VAZIO);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);

  async function executar(operacao) {
    setErro(null);
    try {
      return await operacao();
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setOffline(estaOffline());
    }
  }

  async function carregarPedidos(filtros = {}) {
    setCarregando(true);
    const dados = await executar(() => pesquisarPedidos(filtros));
    if (dados) setPedidos(dados);
    setCarregando(false);
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  function handleBuscar(evento) {
    evento.preventDefault();
    carregarPedidos(filtroCliente ? { cliente: filtroCliente } : {});
  }

  function handleLimparBusca() {
    setFiltroCliente('');
    carregarPedidos();
  }

  async function handleCriar(evento) {
    evento.preventDefault();
    if (!novoPedido.cliente || !novoPedido.entregaId) return;

    setCriando(true);
    const criado = await executar(() => cadastrarPedido(novoPedido));
    setCriando(false);
    if (criado) {
      setNovoPedido(PEDIDO_VAZIO);
      await carregarPedidos();
    }
  }

  function handleIniciarEdicao(pedido) {
    setIdEmEdicao(pedido.id);
    setPedidoEditado({
      cliente: pedido.cliente,
      entregaId: pedido.entregaId,
      veiculoPlaca: pedido.veiculoPlaca,
      status: pedido.status,
      previsaoEntrega: pedido.previsaoEntrega ? pedido.previsaoEntrega.slice(0, 16) : '',
    });
  }

  function handleCancelarEdicao() {
    setIdEmEdicao(null);
    setPedidoEditado(PEDIDO_VAZIO);
  }

  async function handleSalvarEdicao(evento) {
    evento.preventDefault();
    setSalvandoEdicao(true);
    const salvo = await executar(() => alterarPedido(idEmEdicao, pedidoEditado));
    setSalvandoEdicao(false);
    if (salvo) {
      handleCancelarEdicao();
      await carregarPedidos();
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm(`Excluir o pedido ${id}? Essa ação não pode ser desfeita.`)) return;
    setExcluindoId(id);
    const excluido = await executar(() => excluirPedido(id));
    setExcluindoId(null);
    if (excluido) await carregarPedidos();
  }

  async function handleConcluirEntrega(entregaId) {
    setConcluindo(entregaId);
    const resultado = await executar(() => concluirEntrega(entregaId));
    setConcluindo(null);
    if (resultado) {
      window.dispatchEvent(new CustomEvent(EVENTO_ENTREGA_CONCLUIDA, { detail: { entregaId } }));
      await carregarPedidos();
    }
  }

  return (
    <section className="mfe-pedidos">
      <h2>Pedidos por entrega</h2>

      {offline && (
        <p className="aviso-offline" role="status">
          Modo offline: o API Gateway não respondeu. Os dados abaixo são locais e não estão sendo gravados.
        </p>
      )}

      <form className="barra-busca" onSubmit={handleBuscar}>
        <input
          type="text"
          placeholder="Pesquisar por cliente…"
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />
        <button type="submit">Pesquisar</button>
        <button type="button" className="btn-secundario" onClick={handleLimparBusca}>
          Limpar
        </button>
      </form>

      <form className="form-pedido" onSubmit={handleCriar}>
        <h3>Novo pedido</h3>
        <div className="form-grid">
          <label>
            Cliente *
            <input
              type="text"
              required
              value={novoPedido.cliente}
              onChange={(e) => setNovoPedido({ ...novoPedido, cliente: e.target.value })}
            />
          </label>
          <label>
            Entrega (ID) *
            <input
              type="text"
              required
              placeholder="ENT-501"
              value={novoPedido.entregaId}
              onChange={(e) => setNovoPedido({ ...novoPedido, entregaId: e.target.value })}
            />
          </label>
          <label>
            Veículo (placa)
            <input
              type="text"
              placeholder="ABC-1D23"
              value={novoPedido.veiculoPlaca}
              onChange={(e) => setNovoPedido({ ...novoPedido, veiculoPlaca: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={novoPedido.status}
              onChange={(e) => setNovoPedido({ ...novoPedido, status: e.target.value })}
            >
              {STATUS_OPCOES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Previsão de entrega
            <input
              type="datetime-local"
              value={novoPedido.previsaoEntrega}
              onChange={(e) => setNovoPedido({ ...novoPedido, previsaoEntrega: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" disabled={criando}>
          {criando ? 'Cadastrando…' : '+ Cadastrar pedido'}
        </button>
      </form>

      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando pedidos…</p>}

      {!carregando && (
        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Veículo</th>
                <th>Previsão</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={7} className="tabela-vazia">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}

              {pedidos.map((p) =>
                idEmEdicao === p.id ? (
                  <tr key={p.id} className="linha-edicao">
                    <td colSpan={7}>
                      <form className="form-edicao" onSubmit={handleSalvarEdicao}>
                        <input
                          type="text"
                          value={pedidoEditado.cliente}
                          onChange={(e) => setPedidoEditado({ ...pedidoEditado, cliente: e.target.value })}
                        />
                        <input
                          type="text"
                          value={pedidoEditado.entregaId}
                          onChange={(e) => setPedidoEditado({ ...pedidoEditado, entregaId: e.target.value })}
                        />
                        <input
                          type="text"
                          value={pedidoEditado.veiculoPlaca}
                          onChange={(e) => setPedidoEditado({ ...pedidoEditado, veiculoPlaca: e.target.value })}
                        />
                        <select
                          value={pedidoEditado.status}
                          onChange={(e) => setPedidoEditado({ ...pedidoEditado, status: e.target.value })}
                        >
                          {STATUS_OPCOES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          value={pedidoEditado.previsaoEntrega}
                          onChange={(e) =>
                            setPedidoEditado({ ...pedidoEditado, previsaoEntrega: e.target.value })
                          }
                        />
                        <div className="acoes-edicao">
                          <button type="submit" disabled={salvandoEdicao}>
                            {salvandoEdicao ? 'Salvando…' : 'Salvar'}
                          </button>
                          <button type="button" className="btn-secundario" onClick={handleCancelarEdicao}>
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.cliente}</td>
                    <td>{p.entregaId}</td>
                    <CelulaVeiculo pedido={p} />
                    <td>{formatarData(p.previsaoEntrega)}</td>
                    <td>
                      <span className={`badge ${statusClasse[p.status] || ''}`}>{p.status}</span>
                    </td>
                    <td className="acoes-linha">
                      <button type="button" className="btn-secundario" onClick={() => handleIniciarEdicao(p)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-perigo"
                        disabled={excluindoId === p.id}
                        onClick={() => handleExcluir(p.id)}
                      >
                        {excluindoId === p.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                      {p.status !== 'Entregue' && (
                        <button
                          type="button"
                          disabled={concluindo === p.entregaId}
                          onClick={() => handleConcluirEntrega(p.entregaId)}
                        >
                          {concluindo === p.entregaId ? 'Concluindo…' : 'Concluir entrega'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
