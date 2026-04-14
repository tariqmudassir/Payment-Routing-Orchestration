import { useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';
import type { Transaction, TransactionStatus } from '../engine/types';

type StatusFilter = 'all' | TransactionStatus;

function AttemptTimeline({ transaction }: { transaction: Transaction }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-2 border border-gray-100 animate-slide-in">
      <p className="text-xs text-gray-500 mb-3 font-medium">
        Routing Decision
      </p>
      <p className="text-sm text-gray-700 mb-4 bg-white rounded-md px-3 py-2 border border-gray-100">
        {transaction.routingDecision.reasoning}
      </p>

      <div className="space-y-3">
        {transaction.attempts.map((attempt, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  attempt.status === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-red-100 text-red-500'
                }`}
              >
                {attempt.status === 'success' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
              </div>
              {i < transaction.attempts.length - 1 && (
                <div className="w-px h-6 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {attempt.processorName}
                </span>
                {i > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    CASCADE RETRY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span>
                  {attempt.status === 'success' ? (
                    <span className="text-emerald-600 font-medium">Approved</span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      Declined: {attempt.responseCode.replace(/_/g, ' ')}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {attempt.latencyMs}ms
                </span>
                {attempt.fee > 0 && (
                  <span className="text-gray-400">
                    Fee: ${attempt.fee.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {transaction.status === 'recovered' && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-blue-700">
            ✦ RECOVERED — This transaction would have been lost without cascade retry
          </p>
        </div>
      )}
    </div>
  );
}

export default function LiveTransactions() {
  const { state } = useEngine();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered =
    filter === 'all'
      ? state.transactions
      : state.transactions.filter(t => t.status === filter);

  const statusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> Success
          </span>
        );
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            <RefreshCw size={12} /> Recovered
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
            <XCircle size={12} /> Failed
          </span>
        );
    }
  };

  const counts = {
    all: state.transactions.length,
    success: state.transactions.filter(t => t.status === 'success').length,
    recovered: state.transactions.filter(t => t.status === 'recovered').length,
    failed: state.transactions.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Live Transactions</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time feed of routed transactions with full attempt history
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        {(
          [
            ['all', 'All'],
            ['success', 'Success'],
            ['recovered', 'Recovered'],
            ['failed', 'Failed'],
          ] as [StatusFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_80px_80px_70px_50px_1fr_100px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <div />
          <div>ID</div>
          <div className="text-right">Amount</div>
          <div>Card</div>
          <div>Region</div>
          <div>Routed To</div>
          <div className="text-right">Status</div>
        </div>

        {/* Rows */}
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {state.transactions.length === 0
                ? 'Start the simulation to see transactions'
                : 'No transactions match this filter'}
            </div>
          ) : (
            filtered.map(txn => {
              const expanded = expandedId === txn.id;
              const routedTo =
                txn.attempts.length > 0
                  ? txn.attempts.length > 1
                    ? txn.attempts.map(a => a.processorName).join(' → ')
                    : txn.attempts[0].processorName
                  : '—';

              return (
                <div key={txn.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : txn.id)}
                    className={`w-full grid grid-cols-[40px_80px_80px_70px_50px_1fr_100px] gap-3 px-5 py-3 text-sm items-center hover:bg-gray-50/80 transition-colors ${
                      txn.status === 'recovered'
                        ? 'bg-blue-50/30'
                        : txn.status === 'failed'
                          ? 'bg-red-50/30'
                          : ''
                    }`}
                  >
                    <div className="text-gray-400">
                      {expanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-500">{txn.id}</div>
                    <div className="text-right font-semibold text-gray-800">
                      ${txn.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {txn.cardType}
                    </div>
                    <div className="text-xs text-gray-500">{txn.region}</div>
                    <div className="text-xs text-gray-600 truncate text-left">
                      {routedTo}
                    </div>
                    <div className="text-right">{statusBadge(txn.status)}</div>
                  </button>
                  {expanded && (
                    <div className="px-5 pb-4">
                      <AttemptTimeline transaction={txn} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
