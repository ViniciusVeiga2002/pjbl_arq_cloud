import { useEffect, useState } from 'react';
import { getVeiculos } from '../services/api';

// Tela 1 — Mapa da Frota (persona: Coordenador de Frota, RF06 e RF08/RF09)
//
// Para esta atividade formativa o "mapa" é representado como uma lista de
// posições (evita depender de uma biblioteca de mapas/token de API só para
// a entrega). O importante aqui, para a disciplina, é o PADRÃO: componente
// de tela + chamada a um serviço de dados + estado de carregamento.
// Trocar por um mapa real (ex.: Leaflet, Google Maps) depois é só trocar
// o miolo do JSX, mantendo services/api.js igual.
function statusVeiculo(v) {
  if (v.status === 'alerta-velocidade') return { texto: 'Excesso de velocidade', cor: '#d64545' };
  if (v.status === 'parado') return { texto: 'Parado', cor: '#b58900' };
  return { texto: 'Normal', cor: '#2e8b57' };
}

export default function MapaFrota() {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    getVeiculos().then((dados) => {
      if (ativo) {
        setVeiculos(dados);
        setCarregando(false);
      }
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section>
      <h2>Mapa da frota</h2>
      <p className="subtitulo">
        Posição atual de cada veículo em rota, com alerta de excesso de velocidade (RF06 / RF08).
      </p>

      {carregando && <p>Carregando posições…</p>}

      {!carregando && (
        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Motorista</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Velocidade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map((v) => {
                const st = statusVeiculo(v);
                return (
                  <tr key={v.placa}>
                    <td>{v.placa}</td>
                    <td>{v.motorista}</td>
                    <td>{v.lat.toFixed(4)}</td>
                    <td>{v.lng.toFixed(4)}</td>
                    <td>{v.velocidade} km/h</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: st.cor }}>
                        {st.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
