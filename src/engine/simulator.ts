import type { CardType, Region } from './types';

const SOFT_DECLINE_CODES = [
  'issuer_temporarily_unavailable',
  'processor_timeout',
  'rate_limit_exceeded',
  'try_again_later',
];

const HARD_DECLINE_CODES = [
  'insufficient_funds',
  'card_expired',
  'risk_check_failed',
  'do_not_honor',
];

const CARD_WEIGHTS: { type: CardType; weight: number }[] = [
  { type: 'visa', weight: 0.42 },
  { type: 'mastercard', weight: 0.30 },
  { type: 'amex', weight: 0.16 },
  { type: 'discover', weight: 0.12 },
];

const REGION_WEIGHTS: { region: Region; weight: number }[] = [
  { region: 'NA', weight: 0.38 },
  { region: 'EU', weight: 0.28 },
  { region: 'APAC', weight: 0.18 },
  { region: 'LATAM', weight: 0.10 },
  { region: 'MEA', weight: 0.06 },
];

function weightedRandom<T>(items: { weight: number; value: T }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

export function generateTransaction(counter: number) {
  const cardType = weightedRandom(CARD_WEIGHTS.map(c => ({ weight: c.weight, value: c.type })));
  const region = weightedRandom(REGION_WEIGHTS.map(r => ({ weight: r.weight, value: r.region })));
  const amount = Math.round((10 + Math.random() * 490) * 100) / 100;

  return {
    id: `TXN-${counter.toString().padStart(4, '0')}`,
    amount,
    currency: 'USD',
    cardType,
    region,
    timestamp: Date.now(),
  };
}

export function simulateProcessorResponse(
  baseSuccessRate: number,
  degradationFactor: number,
): { success: boolean; responseCode: string; isSoftDecline: boolean } {
  const effectiveRate = baseSuccessRate * degradationFactor;
  const success = Math.random() < effectiveRate;

  if (success) {
    return { success: true, responseCode: 'approved', isSoftDecline: false };
  }

  const isSoftDecline = Math.random() < 0.7;
  const codes = isSoftDecline ? SOFT_DECLINE_CODES : HARD_DECLINE_CODES;
  const responseCode = codes[Math.floor(Math.random() * codes.length)];

  return { success: false, responseCode, isSoftDecline };
}

export function randomLatencyJitter(baseLatency: number): number {
  return Math.max(50, Math.round(baseLatency + (Math.random() - 0.5) * 100));
}
