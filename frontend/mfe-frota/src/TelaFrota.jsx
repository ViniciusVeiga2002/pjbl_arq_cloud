import { useEffect, useState } from 'react';
import { obterPainelFrota, estaOffline } from './services/apiFrota';
import './frota.css';

// Microfrontend "Mapa da frota" (persona: Coordenador de Frota,
// RF06/RF07/RF08). Módulo EXPOSTO pelo remoto mfeFrota e montado pelo shell.
//
// Os veículos chegam ao servico-frota pela fila de telemetria (OBD2/GPS) e
// as entregas são uma projeção atualizada pelos eventos de pedidos — esta
// tela só lê o resultado, já consolidado pelo BFF.
const situacaoVeiculo = {
  ok: { texto: 'Normal', classe: 'veiculo-ok' },
  parado: { texto: 'Parado', classe: 'veiculo-parado' },
  'alerta-velocidade': { texto: 'Excesso de velocidade', classe: 'veiculo-alerta' },
};

const classeDaEntrega = {
  Concluída: 'entrega-concluida',
  'Com atraso': 'entrega-atrasada',
  'Em rota': 'entrega-em-rota',
};

const INTERVALO_DE_ATUALIZACAO_MS = 15000;

function formatarHora(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? iso : data.toLocaleTimeString('pt-BR');
}

function Indicador({ rotulo, valor, destaque }) {
  return (
    <div className={destaque ? 'indicador indicador-destaque' : 'indicador'}>
      <span className="indicador-valor">{valor}</span>
      <span className="indicador-rotulo">{rotulo}</span>
    </div>
  );
}

export default function TelaFrota() {
  const [painel, setPainel] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function atualizar() {
      const dados = await obterPainelFrota();
      if (ativo) {
        setPainel(dados);
        setOffline(estaOffline());
      }
    }
    atualizar();
    const temporizador = setInterval(atualizar, INTERVALO_DE_ATUALIZACAO_MS);
    return () => {
      ativo = false;
      clearInterval(temporizador);
    };
  }, []);

  if (!painel) {
    return (
      <section className="mfe-frota">
        <p>Carregando painel da frota…</p>
      </section>
    );
  }

  const { indicadores, veiculos, entregas } = painel;

  return (
    <section className="mfe-frota">
      <h2>Mapa da frota</h2>
      <p className="subtitulo">
        Posição e velocidade de cada veículo (RF06), alerta de excesso de velocidade (RF08) e situação das entregas
        (RF07). Atualiza a cada 15 s.
      </p>

      {offline && (
        <p className="aviso-offline" role="status">
          Modo offline: o API Gateway não respondeu. Exibindo um painel local de exemplo.
        </p>
      )}

      <div className="indicadores">
        <Indicador rotulo="Veículos" valor={indicadores.veiculos} />
        <Indicador rotulo="Em alerta de velocidade" valor={indicadores.veiculosEmAlerta} destaque={indicadores.veiculosEmAlerta > 0} />
        <Indicador rotulo="Entregas em andamento" valor={indicadores.entregasEmAndamento} />
        <Indicador rotulo="Entregas com atraso" valor={indicadores.entregasComAtraso} destaque={indicadores.entregasComAtraso > 0} />
      </div>

      <h3>Veículos</h3>
      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Motorista</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Velocidade</th>
              <th>Situação</th>
              <th>Última leitura</th>
            </tr>
          </thead>
          <tbody>
            {veiculos.length === 0 && (
              <tr>
                <td colSpan={7} className="tabela-vazia">
                  Nenhuma leitura de telemetria recebida ainda.
                </td>
              </tr>
            )}
            {veiculos.map((v) => {
              const situacao = situacaoVeiculo[v.status] || situacaoVeiculo.ok;
              return (
                <tr key={v.placa}>
                  <td>{v.placa}</td>
                  <td>{v.motorista}</td>
                  <td>{v.lat.toFixed(4)}</td>
                  <td>{v.lng.toFixed(4)}</td>
                  <td>{v.velocidade} km/h</td>
                  <td>
                    <span className={`badge ${situacao.classe}`}>{situacao.texto}</span>
                  </td>
                  <td>{formatarHora(v.registradoEm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>Entregas</h3>
      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Entrega</th>
              <th>Veículo</th>
              <th>Pedidos</th>
              <th>Entregues</th>
              <th>Atrasados</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {entregas.length === 0 && (
              <tr>
                <td colSpan={6} className="tabela-vazia">
                  Nenhuma entrega com pedidos.
                </td>
              </tr>
            )}
            {entregas.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.veiculoPlaca || '—'}</td>
                <td>{e.totalDePedidos}</td>
                <td>{e.pedidosEntregues}</td>
                <td>{e.pedidosAtrasados}</td>
                <td>
                  <span className={`badge ${classeDaEntrega[e.situacao] || ''}`}>{e.situacao}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
