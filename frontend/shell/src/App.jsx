import { Suspense, useEffect, useState } from 'react';
import LimiteDeFalhaDoMicrofrontend from './LimiteDeFalhaDoMicrofrontend.jsx';
import { MICROFRONTENDS } from './microfrontends.js';
import './App.css';

// Contrato de comunicação entre microfrontends: eventos do navegador
// (CustomEvent) com nome e formato combinados, em vez de um importar o
// outro. O mfe-pedidos dispara "pjbl:entrega-concluida"; o shell só escuta
// e avisa o usuário — nenhum dos dois conhece a implementação do outro.
const EVENTO_ENTREGA_CONCLUIDA = 'pjbl:entrega-concluida';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState(MICROFRONTENDS[0].chave);
  const [aviso, setAviso] = useState(null);
  const { Componente, equipe } = MICROFRONTENDS.find((m) => m.chave === telaAtiva);

  useEffect(() => {
    function aoConcluirEntrega(evento) {
      setAviso(`Entrega ${evento.detail.entregaId} concluída. O painel da frota é atualizado pelos eventos do sistema.`);
    }
    window.addEventListener(EVENTO_ENTREGA_CONCLUIDA, aoConcluirEntrega);
    return () => window.removeEventListener(EVENTO_ENTREGA_CONCLUIDA, aoConcluirEntrega);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Telemetria &amp; Gestão de Entregas</h1>
        <p>Dashboard do coordenador de frota</p>
      </header>

      <nav className="tabs">
        {MICROFRONTENDS.map(({ chave, titulo }) => (
          <button
            key={chave}
            type="button"
            className={chave === telaAtiva ? 'tab tab-ativa' : 'tab'}
            onClick={() => setTelaAtiva(chave)}
          >
            {titulo}
          </button>
        ))}
      </nav>

      {aviso && (
        <div className="aviso" role="status">
          <span>{aviso}</span>
          <button type="button" className="aviso-fechar" onClick={() => setAviso(null)} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}

      <main className="app-content">
        <LimiteDeFalhaDoMicrofrontend key={telaAtiva} nome={equipe}>
          <Suspense fallback={<p className="carregando">Carregando {equipe}…</p>}>
            <Componente />
          </Suspense>
        </LimiteDeFalhaDoMicrofrontend>
      </main>

      <footer className="app-footer">
        <span>Grupo PJBL — Fernando Padilha, Hector Saldivar, Theo Otto e Vinicius Veiga</span>
      </footer>
    </div>
  );
}
