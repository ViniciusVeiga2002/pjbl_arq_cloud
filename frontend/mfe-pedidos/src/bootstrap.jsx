import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TelaPedidos from './TelaPedidos.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TelaPedidos />
  </StrictMode>
);
