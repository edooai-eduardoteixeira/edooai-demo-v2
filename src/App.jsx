import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useVerticalConfig } from './hooks/useVerticalConfig.js';
import LandingPage from './pages/LandingPage.jsx';
import DataConnectionPage from './pages/DataConnectionPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import StrategyBuilderPage from './pages/StrategyBuilderPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const config = useVerticalConfig();
  const navigate = useNavigate();

  const go = (path) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  const onHome = () => go('/');

  return (
    <Routes>
      <Route path="/" element={<LandingPage config={config} onNext={() => go('/connect')} onHome={onHome} />} />
      <Route path="/connect" element={<DataConnectionPage config={config} onNext={() => go('/insights')} onHome={onHome} />} />
      <Route path="/insights" element={<InsightsPage config={config} onNext={() => go('/strategy')} onHome={onHome} />} />
      <Route path="/strategy" element={<StrategyBuilderPage config={config} onNext={() => go('/dashboard')} onHome={onHome} />} />
      <Route path="/dashboard" element={<DashboardPage config={config} onHome={onHome} />} />
    </Routes>
  );
}
