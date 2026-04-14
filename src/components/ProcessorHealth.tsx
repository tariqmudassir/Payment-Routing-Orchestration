import {
  Activity,
  Clock,
  DollarSign,
  Globe,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  XOctagon,
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';
import type { ProcessorState } from '../engine/types';

const PROCESSOR_COLORS: Record<string, string> = {
  stripe: '#635BFF',
  adyen: '#0ABF53',
  braintree: '#003366',
  checkout: '#00CC99',
  square: '#006AFF',
  paypal: '#003087',
};

function ProcessorCard({ processor }: { processor: ProcessorState }) {
  const color = PROCESSOR_COLORS[processor.id] || '#94A3B8';
  const hasData = processor.recentResults.length > 0;
  const rate = hasData ? (processor.currentSuccessRate * 100).toFixed(1) : '—';
  const avgFee =
    processor.successCount > 0
      ? (processor.totalFees / processor.successCount).toFixed(2)
      : '—';
  const load = processor.transactionCount / processor.dailyLimit;

  const statusConfig = {
    healthy: {
      label: 'Healthy',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: TrendingUp,
    },
    degraded: {
      label: 'Degraded',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
      icon: AlertTriangle,
    },
    down: {
      label: 'Down',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: XOctagon,
    },
  };

  const sc = statusConfig[processor.status];
  const StatusIcon = sc.icon;

  return (
    <div
      className={`bg-white rounded-card shadow-card border-2 transition-all duration-500 ${sc.border}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: color + '15' }}
          >
            {processor.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{processor.name}</h3>
            <div
              className={`inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}
            >
              <StatusIcon size={11} />
              {sc.label}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {rate}
            {hasData && <span className="text-sm text-gray-400">%</span>}
          </p>
          <p className="text-[11px] text-gray-400">Auth Rate</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {processor.transactionCount.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400">Volume</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {avgFee !== '—' ? '$' + avgFee : '—'}
            </p>
            <p className="text-[10px] text-gray-400">Avg Fee</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {processor.avgLatencyMs}ms
            </p>
            <p className="text-[10px] text-gray-400">Latency</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {processor.successCount}
              <span className="text-gray-400 font-normal">
                {' '}/ {processor.failCount}
              </span>
            </p>
            <p className="text-[10px] text-gray-400">Pass / Fail</p>
          </div>
        </div>
      </div>

      {/* Load Bar */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400">Capacity Load</span>
          <span className="text-[10px] font-mono text-gray-500">
            {(load * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(load * 100, 100)}%`,
              backgroundColor:
                load > 0.8 ? '#EF4444' : load > 0.5 ? '#F59E0B' : color,
            }}
          />
        </div>
      </div>

      {/* Footer: Regions & Cards */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Globe size={12} className="text-gray-400" />
          <span className="text-[11px] text-gray-500">
            {processor.supportedRegions.join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={12} className="text-gray-400" />
          <span className="text-[11px] text-gray-500">
            {processor.supportedCardTypes.length === 4
              ? 'All cards'
              : processor.supportedCardTypes.join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProcessorHealth() {
  const { state } = useEngine();

  const sorted = [...state.processors].sort((a, b) => {
    const statusOrder = { down: 0, degraded: 1, healthy: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const healthyCt = state.processors.filter(p => p.status === 'healthy').length;
  const degradedCt = state.processors.filter(p => p.status === 'degraded').length;
  const downCt = state.processors.filter(p => p.status === 'down').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Processor Health</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Detailed per-processor performance and status
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-healthy" />
            <span className="text-gray-600">{healthyCt} Healthy</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-degraded" />
            <span className="text-gray-600">{degradedCt} Degraded</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-down" />
            <span className="text-gray-600">{downCt} Down</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sorted.map(p => (
          <ProcessorCard key={p.id} processor={p} />
        ))}
      </div>
    </div>
  );
}
