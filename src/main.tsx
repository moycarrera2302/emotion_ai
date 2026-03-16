import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { EmotionProvider } from './context/EmotionContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <HashRouter>
      <EmotionProvider>
        <App />
      </EmotionProvider>
    </HashRouter>
  </StrictMode>,
);
