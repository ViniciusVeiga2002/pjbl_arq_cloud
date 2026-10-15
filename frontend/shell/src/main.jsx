// Fronteira assíncrona exigida pelo Module Federation: o import dinâmico dá
// ao runtime a chance de negociar as dependências compartilhadas (React)
// com os remotos ANTES de qualquer componente ser avaliado.
import('./bootstrap.jsx');
