import type { ProcessorConfig, ProcessorState, Region } from './types';

export const PROCESSOR_CONFIGS: ProcessorConfig[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    feePercentage: 0.029,
    fixedFee: 0.30,
    internationalSurcharge: 0.015,
    supportedRegions: ['NA', 'EU', 'APAC', 'LATAM', 'MEA'],
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover'],
    homeRegions: ['NA'],
    baseSuccessRates: { NA: 0.95, EU: 0.88, APAC: 0.82, LATAM: 0.85, MEA: 0.80 },
    avgLatencyMs: 180,
    dailyLimit: 50000,
  },
  {
    id: 'adyen',
    name: 'Adyen',
    icon: '🏦',
    feePercentage: 0.025,
    fixedFee: 0.25,
    internationalSurcharge: 0.01,
    supportedRegions: ['NA', 'EU', 'APAC', 'MEA'],
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover'],
    homeRegions: ['EU'],
    baseSuccessRates: { NA: 0.89, EU: 0.94, APAC: 0.90, MEA: 0.86 },
    avgLatencyMs: 210,
    dailyLimit: 40000,
  },
  {
    id: 'braintree',
    name: 'Braintree',
    icon: '🌳',
    feePercentage: 0.0259,
    fixedFee: 0.49,
    internationalSurcharge: 0.01,
    supportedRegions: ['NA', 'EU', 'LATAM'],
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover'],
    homeRegions: ['NA', 'LATAM'],
    baseSuccessRates: { NA: 0.92, EU: 0.87, LATAM: 0.91 },
    avgLatencyMs: 200,
    dailyLimit: 35000,
  },
  {
    id: 'checkout',
    name: 'Checkout.com',
    icon: '⚡',
    feePercentage: 0.0225,
    fixedFee: 0.25,
    internationalSurcharge: 0.008,
    supportedRegions: ['NA', 'EU', 'APAC'],
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover'],
    homeRegions: ['EU'],
    baseSuccessRates: { NA: 0.88, EU: 0.93, APAC: 0.86 },
    avgLatencyMs: 160,
    dailyLimit: 45000,
  },
  {
    id: 'square',
    name: 'Square',
    icon: '◻️',
    feePercentage: 0.026,
    fixedFee: 0.10,
    internationalSurcharge: 0,
    supportedRegions: ['NA'],
    supportedCardTypes: ['visa', 'mastercard', 'discover'],
    homeRegions: ['NA'],
    baseSuccessRates: { NA: 0.93 },
    avgLatencyMs: 150,
    dailyLimit: 20000,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    feePercentage: 0.0349,
    fixedFee: 0.49,
    internationalSurcharge: 0.015,
    supportedRegions: ['NA', 'EU', 'APAC', 'LATAM', 'MEA'],
    supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover'],
    homeRegions: ['APAC'],
    baseSuccessRates: { NA: 0.86, EU: 0.85, APAC: 0.91, LATAM: 0.84, MEA: 0.82 },
    avgLatencyMs: 280,
    dailyLimit: 30000,
  },
];

export function createInitialProcessorStates(): ProcessorState[] {
  return PROCESSOR_CONFIGS.map(config => ({
    ...config,
    status: 'healthy' as const,
    currentSuccessRate: Math.max(...Object.values(config.baseSuccessRates)),
    recentResults: [],
    transactionCount: 0,
    successCount: 0,
    failCount: 0,
    totalFees: 0,
    totalVolume: 0,
  }));
}

export function calculateFee(
  processor: ProcessorConfig,
  amount: number,
  region: Region,
): number {
  const isInternational = !processor.homeRegions.includes(region);
  const fee =
    amount * processor.feePercentage +
    processor.fixedFee +
    (isInternational ? amount * processor.internationalSurcharge : 0);
  return Math.round(fee * 100) / 100;
}
