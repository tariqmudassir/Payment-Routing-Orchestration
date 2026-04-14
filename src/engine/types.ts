export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover';
export type Region = 'NA' | 'EU' | 'APAC' | 'LATAM' | 'MEA';
export type ProcessorStatus = 'healthy' | 'degraded' | 'down';
export type TransactionStatus = 'success' | 'recovered' | 'failed';

export interface ProcessorConfig {
  id: string;
  name: string;
  icon: string;
  feePercentage: number;
  fixedFee: number;
  internationalSurcharge: number;
  supportedRegions: Region[];
  supportedCardTypes: CardType[];
  homeRegions: Region[];
  baseSuccessRates: Partial<Record<Region, number>>;
  avgLatencyMs: number;
  dailyLimit: number;
}

export interface ProcessorState extends ProcessorConfig {
  status: ProcessorStatus;
  currentSuccessRate: number;
  recentResults: boolean[];
  transactionCount: number;
  successCount: number;
  failCount: number;
  totalFees: number;
  totalVolume: number;
}

export interface TransactionAttempt {
  processorId: string;
  processorName: string;
  status: 'success' | 'failed';
  responseCode: string;
  latencyMs: number;
  fee: number;
  timestamp: number;
}

export interface ProcessorScore {
  processorId: string;
  processorName: string;
  score: number;
  eligible: boolean;
  details: Record<string, number>;
}

export interface RoutingDecision {
  selectedProcessorId: string;
  selectedProcessorName: string;
  reasoning: string;
  scores: ProcessorScore[];
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  cardType: CardType;
  region: Region;
  timestamp: number;
  status: TransactionStatus;
  attempts: TransactionAttempt[];
  routingDecision: RoutingDecision;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number;
  type: 'success_rate' | 'cost' | 'geography' | 'load_balance' | 'latency';
}

export interface CircuitBreakerConfig {
  degradedThreshold: number;
  downThreshold: number;
  recoveryThreshold: number;
  windowSize: number;
}

export interface GlobalMetrics {
  totalTransactions: number;
  successCount: number;
  recoveredCount: number;
  failedCount: number;
  totalVolume: number;
  totalFees: number;
  baselineFees: number;
  authRate: number;
  authRateHistory: { index: number; rate: number }[];
}

export interface EngineState {
  processors: ProcessorState[];
  transactions: Transaction[];
  rules: RoutingRule[];
  maxRetries: number;
  retryOnSoftDecline: boolean;
  circuitBreaker: CircuitBreakerConfig;
  simulation: { running: boolean; speed: number };
  metrics: GlobalMetrics;
}
