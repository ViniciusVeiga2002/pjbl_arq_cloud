import { useEffect, useState } from 'react';
import { getPedidos, concluirEntrega } from '../services/api';

// Tela 2 — Pedidos por entrega (persona: Coordenador de Frota, RF07)
//
// Esta é a tela que atende ao requisito obrigatório da atividade:
// "comunicação do frontend com pelo menos 1 endpoint GET de Azure
// Functions, utilizando dados mock". A chamada real acontece em
// services/api.js -> getPedidos(), que faz fetch em `${API_BASE_URL}/pedidos`.
const statusClasse = {
  'Em rota': 'status-em-rota',
  Entregue: 'status-entregue',
  Atrasado: 'status-atrasado',
};

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
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

  useEffect(() => {
    let ativo = true;
    getPedidos()
      .then((dados) => {
        if (ativo) setPedidos(dados);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section>
      <h2>Pedidos por entrega</h2>
      <p className="subtitulo">
        Pedidos vinculados a cada entrega em andamento, consumidos via <code>GET /api/pedidos</code> na Azure Function (RF05 / RF07).
      </p>

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
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.cliente}</td>
                  <td>{p.entregaId}</td>
                  <td>{p.veiculoPlaca}</td>
                  <td>{formatarData(p.previsaoEntrega)}</td>
                  <td>
                    <span className={`badge ${statusClasse[p.status] || ''}`}>{p.status}</span>
                  </td>
                  <td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
