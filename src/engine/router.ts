import type {
  ProcessorState,
  ProcessorScore,
  RoutingDecision,
  RoutingRule,
  CardType,
  Region,
} from './types';
import { calculateFee } from './processors';

interface TransactionInput {
  amount: number;
  cardType: CardType;
  region: Region;
}

function scoreProcessor(
  processor: ProcessorState,
  txn: TransactionInput,
  rules: RoutingRule[],
  allProcessors: ProcessorState[],
): ProcessorScore {
  const eligible =
    processor.supportedRegions.includes(txn.region) &&
    processor.supportedCardTypes.includes(txn.cardType) &&
    processor.status !== 'down';

  if (!eligible) {
    return {
      processorId: processor.id,
      processorName: processor.name,
      score: 0,
      eligible: false,
      details: {},
    };
  }

  const details: Record<string, number> = {};
  let totalScore = 0;
  let totalWeight = 0;

  const eligibleProcessors = allProcessors.filter(
    p =>
      p.supportedRegions.includes(txn.region) &&
      p.supportedCardTypes.includes(txn.cardType) &&
      p.status !== 'down',
  );

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let ruleScore = 0;

    switch (rule.type) {
      case 'success_rate':
        ruleScore = processor.currentSuccessRate;
        break;

      case 'cost': {
        const fee = calculateFee(processor, txn.amount, txn.region);
        const fees = eligibleProcessors.map(p => calculateFee(p, txn.amount, txn.region));
        const maxFee = Math.max(...fees);
        const minFee = Math.min(...fees);
        ruleScore = maxFee > minFee ? (maxFee - fee) / (maxFee - minFee) : 1;
        break;
      }

      case 'geography':
        ruleScore = processor.homeRegions.includes(txn.region) ? 1.0 : 0.35;
        break;

      case 'load_balance': {
        const load = processor.transactionCount / processor.dailyLimit;
        ruleScore = Math.max(0, 1 - load);
        break;
      }

      case 'latency': {
        const maxLatency = Math.max(...eligibleProcessors.map(p => p.avgLatencyMs));
        const minLatency = Math.min(...eligibleProcessors.map(p => p.avgLatencyMs));
        ruleScore =
          maxLatency > minLatency
            ? (maxLatency - processor.avgLatencyMs) / (maxLatency - minLatency)
            : 1;
        break;
      }
    }

    if (processor.status === 'degraded') {
      ruleScore *= 0.5;
    }

    details[rule.type] = Math.round(ruleScore * 100) / 100;
    totalScore += ruleScore * (rule.weight / 100);
    totalWeight += rule.weight;
  }

  const finalScore = totalWeight > 0 ? totalScore / (totalWeight / 100) : 0;

  return {
    processorId: processor.id,
    processorName: processor.name,
    score: Math.round(finalScore * 100) / 100,
    eligible: true,
    details,
  };
}

function buildReasoning(
  selected: ProcessorState,
  score: ProcessorScore,
  txn: TransactionInput,
  rules: RoutingRule[],
): string {
  const enabledRules = rules.filter(r => r.enabled);
  const contributions = enabledRules
    .map(rule => ({
      rule,
      value: (score.details[rule.type] ?? 0) * rule.weight,
    }))
    .sort((a, b) => b.value - a.value);

  const reasons: string[] = [];
  const top = contributions[0];

  if (top) {
    const labels: Record<string, string> = {
      success_rate: `best auth rate for ${txn.cardType.charAt(0).toUpperCase() + txn.cardType.slice(1)} in ${txn.region}`,
      cost: 'lowest processing fee',
      geography: selected.homeRegions.includes(txn.region)
        ? `local acquirer for ${txn.region}`
        : `regional coverage for ${txn.region}`,
      load_balance: 'most available capacity',
      latency: 'fastest response time',
    };
    reasons.push(labels[top.rule.type] || top.rule.type);
  }

  if (contributions.length > 1) {
    const second = contributions[1];
    const shortLabels: Record<string, string> = {
      success_rate: 'high auth rate',
      cost: 'low cost',
      geography: 'geo match',
      load_balance: 'capacity available',
      latency: 'fast response',
    };
    reasons.push(shortLabels[second.rule.type] || second.rule.type);
  }

  return `${selected.name} selected (score: ${score.score.toFixed(2)}) — ${reasons.join(', ')}`;
}

export function routeTransaction(
  txn: TransactionInput,
  processors: ProcessorState[],
  rules: RoutingRule[],
): RoutingDecision {
  const scores = processors.map(p => scoreProcessor(p, txn, rules, processors));
  const eligible = scores.filter(s => s.eligible).sort((a, b) => b.score - a.score);

  if (eligible.length === 0) {
    return {
      selectedProcessorId: '',
      selectedProcessorName: 'None',
      reasoning: 'No eligible processor available for this transaction',
      scores,
    };
  }

  const selected = processors.find(p => p.id === eligible[0].processorId)!;
  const reasoning = buildReasoning(selected, eligible[0], txn, rules);

  return {
    selectedProcessorId: selected.id,
    selectedProcessorName: selected.name,
    reasoning,
    scores,
  };
}
