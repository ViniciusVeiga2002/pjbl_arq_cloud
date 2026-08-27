import { useState } from 'react';
import MapaFrota from './pages/MapaFrota';
import PedidosEntrega from './pages/PedidosEntrega';
import './App.css';

// Navegação simples por abas entre as duas telas exigidas pela atividade.
// Sem biblioteca de rotas (react-router) de propósito: para 2 telas, um
// switch de estado já cumpre bem o requisito e mantém o exemplo simples
// de acompanhar. Se o grupo quiser evoluir para mais telas, dá pra trocar
// por react-router-dom depois sem afetar pages/ nem services/.
const TELAS = {
  mapa: { titulo: 'Mapa da frota', componente: MapaFrota },
  pedidos: { titulo: 'Pedidos por entrega', componente: PedidosEntrega },
};

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('mapa');
  const TelaAtual = TELAS[telaAtiva].componente;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Telemetria &amp; Gestão de Entregas</h1>
        <p>Dashboard do coordenador de frota — Atividade Formativa (MFE + Azure Functions)</p>
      </header>

      <nav className="tabs">
        {Object.entries(TELAS).map(([chave, { titulo }]) => (
          <button
            key={chave}
            className={chave === telaAtiva ? 'tab tab-ativa' : 'tab'}
            onClick={() => setTelaAtiva(chave)}
          >
            {titulo}
          </button>
        ))}
      </nav>

      <main className="app-content">
        <TelaAtual />
      </main>

      <footer className="app-footer">
        <span>Grupo PJBL — ver GRUPO.md</span>
      </footer>
    </div>
  );
}
