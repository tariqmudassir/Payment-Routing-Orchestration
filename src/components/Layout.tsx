import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  Activity,
  Server,
  Settings,
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';

export type Screen = 'dashboard' | 'transactions' | 'processors' | 'routing' | 'costs';

const NAV_ITEMS: { id: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Activity },
  { id: 'processors', label: 'Processors', icon: Server },
  { id: 'routing', label: 'Routing', icon: Settings },
  { id: 'costs', label: 'Cost Analysis', icon: DollarSign },
];

interface LayoutProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
}

export default function Layout({ currentScreen, onNavigate, children }: LayoutProps) {
  const {
    state,
    startSimulation,
    stopSimulation,
    setSpeed,
    resetSimulation,
  } = useEngine();
  const { simulation, metrics } = state;

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-sidebar flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <h1 className="text-white text-sm font-bold leading-tight tracking-tight">
                Smart Routing
              </h1>
              <p className="text-indigo-300 text-[11px] font-medium">
                Payment Orchestration
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-surface-sidebar-hover text-white'
                    : 'text-indigo-300 hover:bg-surface-sidebar-hover/50 hover:text-white'
                }`}
              >
                <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Simulation Controls */}
        <div className="px-4 pb-5">
          <div className="border-t border-indigo-800 pt-4">
            <p className="text-indigo-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
              Simulation
            </p>

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={simulation.running ? stopSimulation : startSimulation}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  simulation.running
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {simulation.running ? <Pause size={14} /> : <Play size={14} />}
                {simulation.running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetSimulation}
                className="p-2 rounded-lg text-indigo-400 hover:bg-surface-sidebar-hover hover:text-white transition-colors"
                title="Reset simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Speed control */}
            <div className="mb-3">
              <p className="text-indigo-400 text-[11px] mb-1.5">Speed</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${
                      simulation.speed === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-sidebar-hover/50 text-indigo-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-indigo-400">Status</span>
                <span
                  className={
                    simulation.running ? 'text-emerald-400' : 'text-indigo-300'
                  }
                >
                  {simulation.running ? '● Running' : '○ Paused'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400">Total TXN</span>
                <span className="text-white font-mono">
                  {metrics.totalTransactions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400">Auth Rate</span>
                <span className="text-white font-mono">
                  {metrics.totalTransactions > 0
                    ? (metrics.authRate * 100).toFixed(1) + '%'
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-surface-bg scrollbar-thin">
        <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
