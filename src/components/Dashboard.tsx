import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useEngine } from '../context/EngineContext';
import type { Screen } from './Layout';

const PROCESSOR_COLORS: Record<string, string> = {
  stripe: '#635BFF',
  adyen: '#0ABF53',
  braintree: '#003366',
  checkout: '#00CC99',
  square: '#006AFF',
  paypal: '#003087',
};

function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon size={18} className="text-white" />
        </div>
        {trend && trend !== 'neutral' && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      {subValue && (
        <p className="text-[11px] text-gray-400 mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-status-healthy',
    degraded: 'bg-status-degraded',
    down: 'bg-status-down',
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'} ${
        status === 'degraded' || status === 'down' ? 'animate-pulse' : ''
      }`}
    />
  );
}

export default function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { state } = useEngine();
  const { metrics, processors, transactions } = state;

  const savings = metrics.baselineFees - metrics.totalFees;
  const recoveryRate =
    metrics.recoveredCount + metrics.failedCount > 0
      ? metrics.recoveredCount / (metrics.recoveredCount + metrics.failedCount)
      : 0;

  const volumeData = processors
    .filter(p => p.transactionCount > 0)
    .map(p => ({
      name: p.name,
      volume: p.transactionCount,
      color: PROCESSOR_COLORS[p.id] || '#94A3B8',
    }))
    .sort((a, b) => b.volume - a.volume);

  const recentTxns = transactions.slice(0, 8);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} /> OK
          </span>
        );
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            <RefreshCw size={11} /> Retry
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <XCircle size={11} /> Fail
          </span>
        );
      default:
        return null;
    }
  };

  const hasData = metrics.totalTransactions > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time payment routing performance
        </p>
      </div>

      {!hasData && (
        <div className="bg-brand-50 border border-brand-200 rounded-card p-6 text-center">
          <p className="text-brand-700 font-semibold text-sm">
            Start the simulation from the sidebar to see routing in action
          </p>
          <p className="text-brand-500 text-xs mt-1">
            Transactions will be generated and routed through the intelligent engine
          </p>
        </div>
      )}

      {/* Hero Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Authorization Rate"
          value={hasData ? (metrics.authRate * 100).toFixed(1) + '%' : '—'}
          subValue={hasData ? `${metrics.successCount + metrics.recoveredCount} approved` : undefined}
          trend={hasData ? 'up' : 'neutral'}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <MetricCard
          label="Total Processed"
          value={hasData ? '$' + (metrics.totalVolume / 1000).toFixed(1) + 'K' : '—'}
          subValue={hasData ? `${metrics.totalTransactions} transactions` : undefined}
          trend="neutral"
          icon={CheckCircle2}
          color="bg-brand-500"
        />
        <MetricCard
          label="Volume Today"
          value={hasData ? metrics.totalTransactions.toLocaleString() : '—'}
          trend="neutral"
          icon={TrendingUp}
          color="bg-sky-500"
        />
        <MetricCard
          label="Cost Saved"
          value={hasData ? '$' + savings.toFixed(0) : '—'}
          subValue={
            hasData && metrics.baselineFees > 0
              ? `${((savings / metrics.baselineFees) * 100).toFixed(1)}% vs baseline`
              : undefined
          }
          trend={hasData && savings > 0 ? 'up' : 'neutral'}
          icon={TrendingDown}
          color="bg-amber-500"
        />
        <MetricCard
          label="Recovery Rate"
          value={hasData ? (recoveryRate * 100).toFixed(1) + '%' : '—'}
          subValue={
            hasData ? `${metrics.recoveredCount} recovered via cascade` : undefined
          }
          trend={hasData && recoveryRate > 0 ? 'up' : 'neutral'}
          icon={RefreshCw}
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Auth Rate Trend */}
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Authorization Rate Trend
          </h3>
          {metrics.authRateHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.authRateHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="index"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v + '%'}
                  width={45}
                />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(2) + '%', 'Auth Rate']}
                  labelFormatter={l => `Transaction #${l}`}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Collecting data...
            </div>
          )}
        </div>

        {/* Processor Health Summary */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Processor Health</h3>
            <button
              onClick={() => onNavigate('processors')}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {processors.map(p => {
              const rate = p.recentResults.length > 0
                ? (p.currentSuccessRate * 100).toFixed(1)
                : '—';
              const maxVol = Math.max(...processors.map(pr => pr.transactionCount), 1);
              const barWidth = (p.transactionCount / maxVol) * 100;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <StatusDot status={p.status} />
                  <span className="text-sm font-medium text-gray-700 w-28 truncate">
                    {p.name}
                  </span>
                  <span className="text-xs font-mono text-gray-500 w-12 text-right">
                    {rate}%
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: PROCESSOR_COLORS[p.id] || '#94A3B8',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-12 text-right font-mono">
                    {p.transactionCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Volume by Processor */}
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Volume by Processor
          </h3>
          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString(), 'Transactions']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {volumeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No volume yet
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentTxns.length > 0 ? (
            <div className="space-y-2">
              {recentTxns.map(txn => (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 py-1.5 text-sm"
                >
                  <span className="font-mono text-xs text-gray-400 w-16">
                    {txn.id}
                  </span>
                  <span className="font-semibold text-gray-800 w-16 text-right">
                    ${txn.amount.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-500 uppercase w-10">
                    {txn.cardType.slice(0, 4)}
                  </span>
                  <span className="text-xs text-gray-400 w-10">{txn.region}</span>
                  <span className="text-xs text-gray-600 flex-1 truncate">
                    → {txn.attempts.length > 0
                      ? txn.attempts[txn.attempts.length - 1].processorName
                      : '—'}
                  </span>
                  {statusBadge(txn.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              Waiting for transactions...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
