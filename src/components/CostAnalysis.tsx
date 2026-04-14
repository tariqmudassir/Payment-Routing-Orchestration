import {
  DollarSign,
  TrendingDown,
  RefreshCw,
  ArrowDownRight,
} from 'lucide-react';
import {
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

const PROCESSOR_COLORS: Record<string, string> = {
  stripe: '#635BFF',
  adyen: '#0ABF53',
  braintree: '#003366',
  checkout: '#00CC99',
  square: '#006AFF',
  paypal: '#003087',
};

export default function CostAnalysis() {
  const { state } = useEngine();
  const { metrics, processors, transactions } = state;

  const totalSavings = metrics.baselineFees - metrics.totalFees;
  const savingsPercent =
    metrics.baselineFees > 0 ? (totalSavings / metrics.baselineFees) * 100 : 0;

  // Estimate cascade recovery value
  const recoveredTxns = transactions.filter(t => t.status === 'recovered');
  const recoveredRevenue = recoveredTxns.reduce((s, t) => s + t.amount, 0);

  const feeSavings = Math.max(0, totalSavings - recoveredRevenue * 0.03);
  const recoveryValue = totalSavings - feeSavings;

  const hasData = metrics.totalTransactions > 0;

  // Cost by processor
  const costByProcessor = processors
    .filter(p => p.successCount > 0)
    .map(p => ({
      name: p.name,
      avgFee: Number(((p.totalFees / p.successCount)).toFixed(2)),
      feePercent: Number(
        (
          (p.totalFees /
            (p.totalVolume > 0 ? p.totalVolume : 1)) *
          100
        ).toFixed(2),
      ),
      color: PROCESSOR_COLORS[p.id] || '#94A3B8',
    }))
    .sort((a, b) => a.feePercent - b.feePercent);

  // Cost by card type
  const cardTypeCosts = (['visa', 'mastercard', 'amex', 'discover'] as const).map(
    cardType => {
      const txns = transactions.filter(
        t => t.cardType === cardType && t.status !== 'failed',
      );
      const totalFees = txns.reduce(
        (s, t) => s + t.attempts.reduce((fs, a) => fs + a.fee, 0),
        0,
      );
      const totalVol = txns.reduce((s, t) => s + t.amount, 0);
      return {
        name: cardType.charAt(0).toUpperCase() + cardType.slice(1),
        feePercent: totalVol > 0 ? Number(((totalFees / totalVol) * 100).toFixed(2)) : 0,
      };
    },
  );

  // Cost by region
  const regionCosts = (['NA', 'EU', 'APAC', 'LATAM', 'MEA'] as const).map(region => {
    const txns = transactions.filter(
      t => t.region === region && t.status !== 'failed',
    );
    const totalFees = txns.reduce(
      (s, t) => s + t.attempts.reduce((fs, a) => fs + a.fee, 0),
      0,
    );
    const totalVol = txns.reduce((s, t) => s + t.amount, 0);
    return {
      name: region,
      feePercent: totalVol > 0 ? Number(((totalFees / totalVol) * 100).toFixed(2)) : 0,
      volume: txns.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Cost Analysis</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Processing cost breakdown and savings vs. single-processor baseline
        </p>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <DollarSign size={16} className="text-brand-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Fees (Actual)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {hasData ? '$' + metrics.totalFees.toFixed(0) : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">With smart routing</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <ArrowDownRight size={16} className="text-gray-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">
              Baseline Cost
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-400">
            {hasData ? '$' + metrics.baselineFees.toFixed(0) : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Without routing optimization
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingDown size={16} className="text-white" />
            </div>
            <span className="text-xs font-medium text-emerald-700">Total Savings</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">
            {hasData ? '$' + totalSavings.toFixed(0) : '—'}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {hasData ? savingsPercent.toFixed(1) + '% reduction vs baseline' : '—'}
          </p>
        </div>
      </div>

      {/* Savings Breakdown */}
      {hasData && totalSavings > 0 && (
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Where Savings Come From
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-amber-500" />
                  <span className="text-sm text-gray-700">
                    Fee optimization (cheaper routing)
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${feeSavings.toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalSavings > 0 ? (feeSavings / totalSavings) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-blue-500" />
                  <span className="text-sm text-gray-700">
                    Revenue recovered (cascade retry)
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${recoveryValue.toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalSavings > 0 ? (recoveryValue / totalSavings) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {metrics.recoveredCount} transactions recovered that would have been lost
            without cascade retry = ${recoveredRevenue.toFixed(0)} in revenue
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Cost by Processor */}
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Avg Fee Rate by Processor
          </h3>
          {costByProcessor.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={costByProcessor} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={v => v + '%'}
                  domain={[0, 'auto']}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(2) + '%', 'Fee Rate']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="feePercent" radius={[0, 4, 4, 0]}>
                  {costByProcessor.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Cost by Card Type */}
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Avg Fee Rate by Card Type
          </h3>
          {cardTypeCosts.some(c => c.feePercent > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cardTypeCosts} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v + '%'}
                  width={45}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(2) + '%', 'Fee Rate']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="feePercent" radius={[4, 4, 0, 0]} fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Cost by Region */}
      <div className="bg-white rounded-card shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Avg Fee Rate by Region
        </h3>
        {regionCosts.some(r => r.feePercent > 0) ? (
          <div className="space-y-3">
            {regionCosts
              .filter(r => r.volume > 0)
              .sort((a, b) => a.feePercent - b.feePercent)
              .map(region => {
                const maxRate = Math.max(...regionCosts.map(r => r.feePercent), 1);
                return (
                  <div key={region.name} className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700 w-14">
                      {region.name}
                    </span>
                    <span className="text-xs font-mono text-gray-500 w-14 text-right">
                      {region.feePercent.toFixed(2)}%
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-brand-400 transition-all duration-500"
                        style={{
                          width: `${(region.feePercent / maxRate) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 w-20 text-right">
                      {region.volume} txns
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
