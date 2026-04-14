import {
  TrendingUp,
  DollarSign,
  Globe,
  BarChart3,
  Zap,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';
import type { RoutingRule } from '../engine/types';

const RULE_ICONS: Record<string, typeof TrendingUp> = {
  success_rate: TrendingUp,
  cost: DollarSign,
  geography: Globe,
  load_balance: BarChart3,
  latency: Zap,
};

const RULE_COLORS: Record<string, string> = {
  success_rate: 'bg-emerald-100 text-emerald-600',
  cost: 'bg-amber-100 text-amber-600',
  geography: 'bg-blue-100 text-blue-600',
  load_balance: 'bg-violet-100 text-violet-600',
  latency: 'bg-sky-100 text-sky-600',
};

export default function RoutingConfig() {
  const {
    state,
    updateRules,
    setMaxRetries,
    setRetryOnSoftDecline,
    updateCircuitBreaker,
  } = useEngine();
  const { rules, maxRetries, retryOnSoftDecline, circuitBreaker } = state;

  const handleToggle = (ruleId: string) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r,
    );
    updateRules(normalizeWeights(updated));
  };

  const handleWeightChange = (ruleId: string, newWeight: number) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, weight: newWeight } : r,
    );
    updateRules(redistributeWeights(updated, ruleId, newWeight));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Routing Configuration</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Adjust weights and rules that govern how transactions are routed. Changes take
          effect immediately.
        </p>
      </div>

      {/* Routing Rules */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Routing Rules</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            These weights determine how the scoring engine evaluates processors.
            Enabled rules always sum to 100%.
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {rules.map(rule => {
            const Icon = RULE_ICONS[rule.type] || TrendingUp;
            const colorClass = RULE_COLORS[rule.type] || 'bg-gray-100 text-gray-600';

            return (
              <div
                key={rule.id}
                className={`px-5 py-4 transition-opacity ${
                  !rule.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {rule.name}
                      </h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggle(rule.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-[18px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[14px] after:w-[14px] after:transition-all" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{rule.description}</p>

                    {rule.enabled && (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={80}
                          value={rule.weight}
                          onChange={e =>
                            handleWeightChange(rule.id, Number(e.target.value))
                          }
                          className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-500
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-brand-500
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-700 w-12 text-right font-mono">
                          {rule.weight}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weight summary bar */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-gray-200">
            {rules
              .filter(r => r.enabled)
              .map(r => (
                <div
                  key={r.id}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${r.weight}%`,
                    backgroundColor:
                      {
                        success_rate: '#10B981',
                        cost: '#F59E0B',
                        geography: '#3B82F6',
                        load_balance: '#8B5CF6',
                        latency: '#0EA5E9',
                      }[r.type] || '#94A3B8',
                  }}
                  title={`${r.name}: ${r.weight}%`}
                />
              ))}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {rules
              .filter(r => r.enabled)
              .map(r => (
                <span key={r.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        {
                          success_rate: '#10B981',
                          cost: '#F59E0B',
                          geography: '#3B82F6',
                          load_balance: '#8B5CF6',
                          latency: '#0EA5E9',
                        }[r.type] || '#94A3B8',
                    }}
                  />
                  {r.name} ({r.weight}%)
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cascade Retry */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <RefreshCw size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Cascade Retry</h3>
              <p className="text-xs text-gray-500">
                Retry failed transactions through alternative processors
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Retry on soft decline</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={retryOnSoftDecline}
                  onChange={e => setRetryOnSoftDecline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-[18px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[14px] after:w-[14px] after:transition-all" />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Max retry attempts</span>
                <span className="text-sm font-bold text-gray-900 font-mono">
                  {maxRetries}
                </span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxRetries(n)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      maxRetries === n
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Circuit Breaker */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <ShieldCheck size={16} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Circuit Breaker</h3>
              <p className="text-xs text-gray-500">
                Automatically remove unhealthy processors from routing
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Degraded below</span>
                <span className="text-sm font-bold text-amber-600 font-mono">
                  {circuitBreaker.degradedThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={circuitBreaker.degradedThreshold}
                onChange={e =>
                  updateCircuitBreaker({
                    degradedThreshold: Number(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-amber-500
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-amber-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Down below</span>
                <span className="text-sm font-bold text-red-500 font-mono">
                  {circuitBreaker.downThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={circuitBreaker.downThreshold}
                onChange={e =>
                  updateCircuitBreaker({
                    downThreshold: Number(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-red-500
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-red-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Recovery above</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">
                  {circuitBreaker.recoveryThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={99}
                value={circuitBreaker.recoveryThreshold}
                onChange={e =>
                  updateCircuitBreaker({
                    recoveryThreshold: Number(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-emerald-500
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeWeights(rules: RoutingRule[]): RoutingRule[] {
  const enabled = rules.filter(r => r.enabled);
  if (enabled.length === 0) return rules;

  const total = enabled.reduce((s, r) => s + r.weight, 0);
  if (total === 0) {
    const even = Math.floor(100 / enabled.length);
    let remainder = 100 - even * enabled.length;
    return rules.map(r => {
      if (!r.enabled) return r;
      const w = even + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      return { ...r, weight: w };
    });
  }
  return rules;
}

function redistributeWeights(
  rules: RoutingRule[],
  changedId: string,
  newWeight: number,
): RoutingRule[] {
  const otherEnabled = rules.filter(r => r.enabled && r.id !== changedId);
  const remaining = 100 - newWeight;

  if (otherEnabled.length === 0) {
    return rules.map(r => (r.id === changedId ? { ...r, weight: 100 } : r));
  }

  const otherTotal = otherEnabled.reduce((s, r) => s + r.weight, 0);

  return rules.map(r => {
    if (r.id === changedId) return { ...r, weight: newWeight };
    if (!r.enabled) return r;
    if (otherTotal === 0) {
      return { ...r, weight: Math.round(remaining / otherEnabled.length) };
    }
    return { ...r, weight: Math.max(0, Math.round((r.weight / otherTotal) * remaining)) };
  });
}
