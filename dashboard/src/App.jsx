import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Tasks from './views/Tasks';
import Agents from './views/Agents';
import Vault from './views/Vault';
import Briefings from './views/Briefings';

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
};

const mainStyle = {
  flex: 1,
  padding: '24px 32px',
};

export default function App() {
  return (
    <div style={layoutStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <Routes>
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/briefings" element={<Briefings />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
    </div>
  );
}
