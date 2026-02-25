import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVerticalConfig } from './hooks/useVerticalConfig.js';
import LandingPage from './pages/LandingPage.jsx';
import DataConnectionPage from './pages/DataConnectionPage.jsx';
import StrategyBuilderPage from './pages/StrategyBuilderPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const config = useVerticalConfig();

  const goToScreen = (screen) => {
    window.scrollTo(0, 0);
    setCurrentScreen(screen);
  };

  switch (currentScreen) {
    case 1:
      return <LandingPage config={config} onNext={() => goToScreen(2)} />;
    case 2:
      return <DataConnectionPage config={config} onNext={() => goToScreen(3)} />;
    case 3:
      return <StrategyBuilderPage config={config} onNext={() => goToScreen(4)} />;
    case 4:
      return <DashboardPage config={config} />;
    default:
      return <LandingPage config={config} onNext={() => goToScreen(2)} />;
  }
}
