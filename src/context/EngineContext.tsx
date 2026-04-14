import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  EngineState,
  RoutingRule,
  CircuitBreakerConfig,
  TransactionAttempt,
  Transaction,
  TransactionStatus,
  ProcessorStatus,
} from '../engine/types';
import { createInitialProcessorStates, calculateFee } from '../engine/processors';
import { routeTransaction } from '../engine/router';
import {
  generateTransaction,
  simulateProcessorResponse,
  randomLatencyJitter,
} from '../engine/simulator';

const DEFAULT_RULES: RoutingRule[] = [
  {
    id: 'success_rate',
    name: 'Success Rate Optimization',
    description: 'Prioritize processors with highest auth rate for the transaction profile',
    enabled: true,
    weight: 35,
    type: 'success_rate',
  },
  {
    id: 'cost',
    name: 'Cost Optimization',
    description: 'Route to cheapest eligible processor when auth rates are comparable',
    enabled: true,
    weight: 20,
    type: 'cost',
  },
  {
    id: 'geography',
    name: 'Geographic Match',
    description: "Prefer local acquirers for the cardholder's region",
    enabled: true,
    weight: 25,
    type: 'geography',
  },
  {
    id: 'load_balance',
    name: 'Load Balancing',
    description: 'Distribute volume to avoid hitting processor capacity limits',
    enabled: true,
    weight: 10,
    type: 'load_balance',
  },
  {
    id: 'latency',
    name: 'Latency Optimization',
    description: 'Prefer faster processors for better checkout experience',
    enabled: true,
    weight: 10,
    type: 'latency',
  },
];

const INITIAL_STATE: EngineState = {
  processors: createInitialProcessorStates(),
  transactions: [],
  rules: DEFAULT_RULES,
  maxRetries: 2,
  retryOnSoftDecline: true,
  circuitBreaker: {
    degradedThreshold: 80,
    downThreshold: 50,
    recoveryThreshold: 85,
    windowSize: 50,
  },
  simulation: { running: false, speed: 3 },
  metrics: {
    totalTransactions: 0,
    successCount: 0,
    recoveredCount: 0,
    failedCount: 0,
    totalVolume: 0,
    totalFees: 0,
    baselineFees: 0,
    authRate: 0,
    authRateHistory: [],
  },
};

const SPEED_INTERVALS: Record<number, number> = {
  1: 2000,
  2: 1000,
  3: 500,
  4: 200,
  5: 100,
};

function processOneTick(
  state: EngineState,
  degradationFactors: Record<string, number>,
): EngineState {
  const txnCounter = state.metrics.totalTransactions + 1;
  const raw = generateTransaction(txnCounter);

  const decision = routeTransaction(
    { amount: raw.amount, cardType: raw.cardType, region: raw.region },
    state.processors,
    state.rules,
  );

  const rankedEligible = decision.scores
    .filter(s => s.eligible)
    .sort((a, b) => b.score - a.score);

  if (rankedEligible.length === 0) {
    const failedTxn: Transaction = {
      ...raw,
      status: 'failed',
      attempts: [],
      routingDecision: decision,
    };
    return {
      ...state,
      transactions: [failedTxn, ...state.transactions].slice(0, 200),
      metrics: {
        ...state.metrics,
        totalTransactions: txnCounter,
        failedCount: state.metrics.failedCount + 1,
        totalVolume: state.metrics.totalVolume + raw.amount,
        authRate:
          (state.metrics.successCount + state.metrics.recoveredCount) / txnCounter,
        authRateHistory: maybeAppendHistory(
          state.metrics.authRateHistory,
          txnCounter,
          (state.metrics.successCount + state.metrics.recoveredCount) / txnCounter,
        ),
      },
    };
  }

  const maxAttempts = Math.min(
    1 + (state.retryOnSoftDecline ? state.maxRetries : 0),
    rankedEligible.length,
  );

  const attempts: TransactionAttempt[] = [];
  let finalStatus: TransactionStatus = 'failed';
  let totalFee = 0;

  for (let i = 0; i < maxAttempts; i++) {
    const procId = rankedEligible[i].processorId;
    const proc = state.processors.find(p => p.id === procId)!;
    const baseRate = proc.baseSuccessRates[raw.region] ?? 0.7;
    const degFactor = degradationFactors[procId] ?? 1;

    const response = simulateProcessorResponse(baseRate, degFactor);
    const latency = randomLatencyJitter(proc.avgLatencyMs);
    const fee = response.success ? calculateFee(proc, raw.amount, raw.region) : 0;

    attempts.push({
      processorId: procId,
      processorName: proc.name,
      status: response.success ? 'success' : 'failed',
      responseCode: response.responseCode,
      latencyMs: latency,
      fee,
      timestamp: Date.now(),
    });

    if (response.success) {
      finalStatus = i === 0 ? 'success' : 'recovered';
      totalFee = fee;
      break;
    }

    if (!response.isSoftDecline || !state.retryOnSoftDecline) break;
  }

  const transaction: Transaction = {
    ...raw,
    status: finalStatus,
    attempts,
    routingDecision: decision,
  };

  // Update processor states
  const updatedProcessors = state.processors.map(proc => {
    const procAttempts = attempts.filter(a => a.processorId === proc.id);
    if (procAttempts.length === 0) return proc;

    const newResults = [
      ...proc.recentResults,
      ...procAttempts.map(a => a.status === 'success'),
    ].slice(-state.circuitBreaker.windowSize);

    const windowSuccesses = newResults.filter(Boolean).length;
    const currentSuccessRate =
      newResults.length > 0 ? windowSuccesses / newResults.length : proc.currentSuccessRate;

    let status: ProcessorStatus;
    if (newResults.length < 5) {
      status = proc.status;
    } else if (currentSuccessRate >= state.circuitBreaker.degradedThreshold / 100) {
      status = 'healthy';
    } else if (currentSuccessRate >= state.circuitBreaker.downThreshold / 100) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      ...proc,
      recentResults: newResults,
      currentSuccessRate,
      status,
      transactionCount: proc.transactionCount + procAttempts.length,
      successCount:
        proc.successCount + procAttempts.filter(a => a.status === 'success').length,
      failCount:
        proc.failCount + procAttempts.filter(a => a.status === 'failed').length,
      totalFees: proc.totalFees + procAttempts.reduce((s, a) => s + a.fee, 0),
      totalVolume:
        proc.totalVolume +
        (procAttempts.some(a => a.status === 'success') ? raw.amount : 0),
    };
  });

  // Baseline: most expensive eligible processor fee
  const eligibleForBaseline = state.processors.filter(
    p =>
      p.supportedRegions.includes(raw.region) &&
      p.supportedCardTypes.includes(raw.cardType),
  );
  const baselineFee =
    finalStatus !== 'failed'
      ? Math.max(...eligibleForBaseline.map(p => calculateFee(p, raw.amount, raw.region)))
      : 0;

  const newSuccessCount =
    state.metrics.successCount + (finalStatus === 'success' ? 1 : 0);
  const newRecoveredCount =
    state.metrics.recoveredCount + (finalStatus === 'recovered' ? 1 : 0);
  const newFailedCount =
    state.metrics.failedCount + (finalStatus === 'failed' ? 1 : 0);
  const newAuthRate = (newSuccessCount + newRecoveredCount) / txnCounter;

  return {
    ...state,
    processors: updatedProcessors,
    transactions: [transaction, ...state.transactions].slice(0, 200),
    metrics: {
      totalTransactions: txnCounter,
      successCount: newSuccessCount,
      recoveredCount: newRecoveredCount,
      failedCount: newFailedCount,
      totalVolume: state.metrics.totalVolume + raw.amount,
      totalFees: state.metrics.totalFees + totalFee,
      baselineFees: state.metrics.baselineFees + baselineFee,
      authRate: newAuthRate,
      authRateHistory: maybeAppendHistory(
        state.metrics.authRateHistory,
        txnCounter,
        newAuthRate,
      ),
    },
  };
}

function maybeAppendHistory(
  history: { index: number; rate: number }[],
  txnCount: number,
  rate: number,
) {
  if (txnCount % 5 !== 0) return history;
  return [...history, { index: txnCount, rate: Math.round(rate * 10000) / 100 }].slice(
    -60,
  );
}

interface EngineContextValue {
  state: EngineState;
  startSimulation: () => void;
  stopSimulation: () => void;
  setSpeed: (speed: number) => void;
  updateRules: (rules: RoutingRule[]) => void;
  setMaxRetries: (n: number) => void;
  setRetryOnSoftDecline: (v: boolean) => void;
  updateCircuitBreaker: (config: Partial<CircuitBreakerConfig>) => void;
  resetSimulation: () => void;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngineState>(INITIAL_STATE);
  const degradationRef = useRef<Record<string, number>>({});
  const degradationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Simulation tick loop
  useEffect(() => {
    if (!state.simulation.running) return;

    const interval = setInterval(() => {
      setState(prev => processOneTick(prev, degradationRef.current));
    }, SPEED_INTERVALS[state.simulation.speed] ?? 500);

    return () => clearInterval(interval);
  }, [state.simulation.running, state.simulation.speed]);

  // Degradation event scheduling
  useEffect(() => {
    if (!state.simulation.running) return;

    const scheduleEvent = () => {
      const delay = 20000 + Math.random() * 25000;
      const timer = setTimeout(() => {
        const processorIds = INITIAL_STATE.processors.map(p => p.id);
        const targetId = processorIds[Math.floor(Math.random() * processorIds.length)];
        degradationRef.current[targetId] = 0.25 + Math.random() * 0.2;

        const recoveryDelay = 12000 + Math.random() * 10000;
        const recoveryTimer = setTimeout(() => {
          delete degradationRef.current[targetId];
        }, recoveryDelay);
        degradationTimersRef.current.push(recoveryTimer);

        const nextTimer = scheduleEvent();
        degradationTimersRef.current.push(nextTimer);
      }, delay);
      return timer;
    };

    const firstTimer = scheduleEvent();
    degradationTimersRef.current.push(firstTimer);

    return () => {
      degradationTimersRef.current.forEach(clearTimeout);
      degradationTimersRef.current = [];
    };
  }, [state.simulation.running]);

  const startSimulation = useCallback(() => {
    setState(prev => ({ ...prev, simulation: { ...prev.simulation, running: true } }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState(prev => ({ ...prev, simulation: { ...prev.simulation, running: false } }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, simulation: { ...prev.simulation, speed } }));
  }, []);

  const updateRules = useCallback((rules: RoutingRule[]) => {
    setState(prev => ({ ...prev, rules }));
  }, []);

  const setMaxRetries = useCallback((maxRetries: number) => {
    setState(prev => ({ ...prev, maxRetries }));
  }, []);

  const setRetryOnSoftDecline = useCallback((retryOnSoftDecline: boolean) => {
    setState(prev => ({ ...prev, retryOnSoftDecline }));
  }, []);

  const updateCircuitBreaker = useCallback(
    (config: Partial<CircuitBreakerConfig>) => {
      setState(prev => ({
        ...prev,
        circuitBreaker: { ...prev.circuitBreaker, ...config },
      }));
    },
    [],
  );

  const resetSimulation = useCallback(() => {
    degradationRef.current = {};
    degradationTimersRef.current.forEach(clearTimeout);
    degradationTimersRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return (
    <EngineContext.Provider
      value={{
        state,
        startSimulation,
        stopSimulation,
        setSpeed,
        updateRules,
        setMaxRetries,
        setRetryOnSoftDecline,
        updateCircuitBreaker,
        resetSimulation,
      }}
    >
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
}
