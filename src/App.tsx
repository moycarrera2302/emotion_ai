import { Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { HomePage } from './pages/HomePage';
import { VisualPage } from './pages/VisualPage';
import { MindfulnessPage } from './pages/MindfulnessPage';
import { TimelinePage } from './pages/TimelinePage';
import { THEME } from './utils/colors';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/visual" element={<VisualPage />} />
        <Route path="/mindfulness" element={<MindfulnessPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
      </Routes>
    </div>
  );
}
