import { Component, type ReactNode } from 'react';

// Isolamento de falhas entre microfrontends: se o remoteEntry.js de um
// remoto não carregar (deploy quebrado, rede) ou a tela lançar um erro, só
// a área daquele microfrontend mostra o aviso — o shell e os demais
// microfrontends continuam funcionando.
interface Props {
  nome: string;
  children: ReactNode;
}

interface Estado {
  erro: unknown;
}

export default class LimiteDeFalhaDoMicrofrontend extends Component<Props, Estado> {
  state: Estado = { erro: null };

  static getDerivedStateFromError(erro: unknown): Estado {
    return { erro };
  }

  componentDidCatch(erro: unknown) {
    console.error(`[shell] Falha no microfrontend ${this.props.nome}`, erro);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="falha-mfe" role="alert">
          <strong>Não foi possível carregar “{this.props.nome}”.</strong>
          <p>As demais áreas do painel continuam disponíveis.</p>
          <button type="button" onClick={() => this.setState({ erro: null })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
