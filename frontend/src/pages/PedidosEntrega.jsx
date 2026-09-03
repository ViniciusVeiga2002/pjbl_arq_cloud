import { useEffect, useState } from 'react';
import {
  getPedidos,
  criarPedido,
  atualizarPedido,
  excluirPedido,
  concluirEntrega,
} from '../services/api';

// Tela 2 — Pedidos por entrega (persona: Coordenador de Frota, RF05/RF07)
//
// Esta tela exercita as 4 Azure Functions de CRUD ligadas ao MongoDB Atlas
// (ver GUIA_MONGODB_CRUD.md):
//   pesquisar -> GET    /api/pedidos (com filtro opcional por cliente)
//   inserir   -> POST   /api/pedidos
//   alterar   -> PUT    /api/pedidos/{id}
//   excluir   -> DELETE /api/pedidos/{id}
// O botão "Concluir entrega" é uma funcionalidade anterior (Apidog, RF10)
// e continua funcionando à parte, sem depender do MongoDB.
const statusClasse = {
  'Em rota': 'status-em-rota',
  Entregue: 'status-entregue',
  Atrasado: 'status-atrasado',
};

const STATUS_OPCOES = ['Aguardando coleta', 'Em rota', 'Entregue', 'Atrasado'];

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

export default function PedidosEntrega() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [concluindo, setConcluindo] = useState(null);

  const [filtroCliente, setFiltroCliente] = useState('');
  const [novoPedido, setNovoPedido] = useState(PEDIDO_VAZIO);
  const [criando, setCriando] = useState(false);

  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [pedidoEditado, setPedidoEditado] = useState(PEDIDO_VAZIO);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);

  async function carregarPedidos(filtros = {}) {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await getPedidos(filtros);
      setPedidos(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  // --- Pesquisar (GET /api/pedidos?cliente=...) ---
  function handleBuscar(evento) {
    evento.preventDefault();
    carregarPedidos(filtroCliente ? { cliente: filtroCliente } : {});
  }

  function handleLimparBusca() {
    setFiltroCliente('');
    carregarPedidos();
  }

  // --- Inserir (POST /api/pedidos) ---
  async function handleCriar(evento) {
    evento.preventDefault();
    if (!novoPedido.cliente || !novoPedido.entregaId) return;

    setCriando(true);
    try {
      await criarPedido(novoPedido);
      setNovoPedido(PEDIDO_VAZIO);
      await carregarPedidos();
    } finally {
      setCriando(false);
    }
  }

  // --- Alterar (PUT /api/pedidos/{id}) ---
  function handleIniciarEdicao(pedido) {
    setIdEmEdicao(pedido.id);
    setPedidoEditado({
      cliente: pedido.cliente,
      entregaId: pedido.entregaId,
      veiculoPlaca: pedido.veiculoPlaca,
      status: pedido.status,
      previsaoEntrega: pedido.previsaoEntrega ? pedido.previsaoEntrega.slice(0, 19) : '',
    });
  }

  function handleCancelarEdicao() {
    setIdEmEdicao(null);
    setPedidoEditado(PEDIDO_VAZIO);
  }

  async function handleSalvarEdicao(evento) {
    evento.preventDefault();
    setSalvandoEdicao(true);
    try {
      await atualizarPedido(idEmEdicao, pedidoEditado);
      handleCancelarEdicao();
      await carregarPedidos();
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // --- Excluir (DELETE /api/pedidos/{id}) ---
  async function handleExcluir(id) {
    if (!window.confirm(`Excluir o pedido ${id}? Essa ação não pode ser desfeita.`)) return;
    setExcluindoId(id);
    try {
      await excluirPedido(id);
      await carregarPedidos();
    } finally {
      setExcluindoId(null);
    }
  }

  // --- Concluir entrega (Apidog, RF10 — funcionalidade anterior) ---
  async function handleConcluirEntrega(entregaId) {
    setConcluindo(entregaId);
    try {
      await concluirEntrega(entregaId);
      setPedidos((atual) =>
        atual.map((p) => (p.entregaId === entregaId ? { ...p, status: 'Entregue' } : p))
      );
    } finally {
      setConcluindo(null);
    }
  }

  return (
    <section>
      <h2>Pedidos por entrega</h2>

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

      {carregando && <p>Carregando pedidos…</p>}
      {erro && <p className="erro">Erro ao carregar pedidos: {erro}</p>}

      {!carregando && !erro && (
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
                    <td>{p.veiculoPlaca}</td>
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
