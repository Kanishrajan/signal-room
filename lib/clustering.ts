/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Receipt, ChannelFilter, ClusterEvaluation, Chapter, assertNever } from '@/types/receipt';
import { computePairScore, extractReceiptLabels } from '@/lib/scoring';

export function isReceiptNoise(receipt: Receipt, override?: boolean): boolean {
  if (typeof override === 'boolean') {
    return override;
  }
  if (receipt.type === 'card' && receipt.isFraud) {
    return true;
  }
  return receipt.confidence < 0.65;
}

export function filterReceipts(
  receipts: Receipt[],
  channel: ChannelFilter,
  searchQuery: string,
  _noiseOverrides: Record<string, boolean>
): Receipt[] {
  const query = searchQuery.trim().toLowerCase();

  return receipts.filter((receipt) => {
    // Channel filter
    if (channel !== 'all' && receipt.type !== channel) {
      return false;
    }

    // Query filter
    if (!query) {
      return true;
    }

    switch (receipt.type) {
      case 'music':
        return (
          receipt.title.toLowerCase().includes(query) ||
          receipt.artist.toLowerCase().includes(query) ||
          receipt.album.toLowerCase().includes(query)
        );
      case 'ledger':
        return (
          receipt.note.toLowerCase().includes(query) ||
          receipt.category.toLowerCase().includes(query) ||
          receipt.subcategory.toLowerCase().includes(query)
        );
      case 'card':
        return (
          (receipt.merchant?.toLowerCase().includes(query) ?? false) ||
          (receipt.category?.toLowerCase().includes(query) ?? false) ||
          (receipt.city?.toLowerCase().includes(query) ?? false)
        );
      default:
        return assertNever(receipt);
    }
  });
}

export function formatReceiptAmount(r: Receipt): string | null {
  switch (r.type) {
    case 'music':
      return `${Math.round(r.playedMs / 1000 / 60)} min`;
    case 'ledger':
      return `${r.direction === 'income' ? '+' : '-'}INR ${r.amount.toFixed(2)}`;
    case 'card':
      return `AMT ${r.amount.toFixed(2)}`;
    default:
      return assertNever(r);
  }
}

export function formatTimestamp(isoString: string): {
  date: string;
  time: string;
  shortDate: string;
} {
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const shortDate = d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { date, time, shortDate };
}

export function evaluateCluster(a: Receipt, b: Receipt): ClusterEvaluation {
  const pairScore = computePairScore(a, b);
  const labelA = extractReceiptLabels(a);
  const labelB = extractReceiptLabels(b);

  const isLateNight = (labelA.hour >= 22 || labelA.hour <= 4) && (labelB.hour >= 22 || labelB.hour <= 4);
  const hasCardFraud = (a.type === 'card' && a.isFraud) || (b.type === 'card' && b.isFraud);
  const hasMusic = a.type === 'music' || b.type === 'music';
  const hasLedger = a.type === 'ledger' || b.type === 'ledger';
  const hasCard = a.type === 'card' || b.type === 'card';

  let patternType = 'Cross-Stream Corroboration';
  let theme: Chapter['theme'] = 'routine';
  let title = 'Echoes in the Register';
  let subtitle = `${labelA.primary} & ${labelB.primary}`;
  let narrative = '';

  if (hasCardFraud) {
    patternType = 'Anomalous Static Spike';
    theme = 'recovery';
    title = 'Noise at the Border';
    narrative = `A disputed card entry collides with surrounding activity. While financial systems flag interference, adjacent records anchor what was actually occurring in the physical room.`;
  } else if (isLateNight) {
    patternType = 'Nocturnal Convergence';
    theme = 'night';
    title = 'The 02:00 Resonance';
    narrative = `Separated by minutes in the small hours, "${labelA.primary}" and "${labelB.primary}" expose a quiet vigil—caffeine, audio texture, or late calculations when daylight rhythm fades.`;
  } else if (hasMusic && (hasCard || hasLedger)) {
    patternType = 'Sonic Routine Synchrony';
    theme = 'focus';
    title = 'Ritual of Attention';
    narrative = `Soundtrack intersects with tangible expense. As money moved for essentials, "${labelA.primary}" provided the sensory shelter for focused labor.`;
  } else if (hasLedger && hasCard) {
    patternType = 'Dual-Ledger Triangulation';
    theme = 'transition';
    title = 'The Accounting of Intent';
    narrative = `Self-reported domestic logs align with bank telemetry. Intended budget notes meet real terminal timestamps, capturing the friction between plans and purchases.`;
  } else {
    patternType = 'Temporal Alignment';
    theme = 'impulse';
    title = 'Concentric Moments';
    narrative = `Two records within a singular window corroborate an inflection point. The coincidence of rhythm and movement confirms a deliberate life choice.`;
  }

  const factorText = pairScore.heuristicFactors.join(' · ');
  const explanation = `${pairScore.score}% resonance [${factorText}].`;

  const sortedTs = [a.timestamp, b.timestamp].sort();
  const dateRange = `${formatTimestamp(sortedTs[0]).date}`;

  const matchedChapter: Omit<Chapter, 'unlockedOrder' | 'receiptIds'> = {
    id: `ch-${a.id}-${b.id}`,
    title,
    subtitle: `${subtitle} (${dateRange})`,
    narrativeFragment: narrative,
    theme,
    timestamp: sortedTs[0],
  };

  return {
    score: pairScore.score,
    strength: pairScore.strength,
    patternType,
    explanation,
    matchedChapter,
  };
}
