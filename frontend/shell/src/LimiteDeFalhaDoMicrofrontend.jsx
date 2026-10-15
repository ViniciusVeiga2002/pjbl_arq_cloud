import { Component } from 'react';

// Isolamento de falhas entre microfrontends: se o remoteEntry.js de um
// remoto não carregar (deploy quebrado, rede) ou a tela lançar um erro, só
// a área daquele microfrontend mostra o aviso — o shell e os demais
// microfrontends continuam funcionando.
export default class LimiteDeFalhaDoMicrofrontend extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
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
