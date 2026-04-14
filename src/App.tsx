import { useState } from 'react';
import { EngineProvider } from './context/EngineContext';
import Layout, { type Screen } from './components/Layout';
import Dashboard from './components/Dashboard';
import LiveTransactions from './components/LiveTransactions';
import ProcessorHealth from './components/ProcessorHealth';
import RoutingConfig from './components/RoutingConfig';
import CostAnalysis from './components/CostAnalysis';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  return (
    <EngineProvider>
      <Layout currentScreen={screen} onNavigate={setScreen}>
        {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
        {screen === 'transactions' && <LiveTransactions />}
        {screen === 'processors' && <ProcessorHealth />}
        {screen === 'routing' && <RoutingConfig />}
        {screen === 'costs' && <CostAnalysis />}
      </Layout>
    </EngineProvider>
  );
}
