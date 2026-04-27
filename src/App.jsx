import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MockSession from './pages/MockSession.jsx';
import CodingPractice from './pages/CodingPractice.jsx';
import KnowledgeBase from './pages/KnowledgeBase.jsx';
import SessionSummary from './pages/SessionSummary.jsx';
import Settings from './pages/Settings.jsx';
import { useStore } from './lib/store.js';

export default function App() {
  const loadConfig = useStore((s) => s.loadConfig);
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/session" element={<MockSession />} />
            <Route path="/coding" element={<CodingPractice />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/summary" element={<SessionSummary />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
