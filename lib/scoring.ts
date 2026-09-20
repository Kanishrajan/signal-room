/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Receipt, assertNever } from '@/types/receipt';

export interface ProximityScore {
  timeDiffHours: number;
  timeScore: number;
}

export function computeTimeDifferenceHours(t1: string, t2: string): number {
  const d1 = new Date(t1).getTime();
  const d2 = new Date(t2).getTime();
  return Math.abs(d1 - d2) / (1000 * 60 * 60);
}

export function scoreTemporalProximity(t1: string, t2: string): ProximityScore {
  const hours = computeTimeDifferenceHours(t1, t2);
  let timeScore = 0;

  if (hours <= 2) {
    timeScore = 40;
  } else if (hours <= 12) {
    timeScore = 32;
  } else if (hours <= 24) {
    timeScore = 24;
  } else if (hours <= 72) {
    timeScore = 16;
  } else if (hours <= 168) {
    timeScore = 10;
  } else {
    timeScore = 4;
  }

  return { timeDiffHours: hours, timeScore };
}

export function extractReceiptLabels(r: Receipt): {
  primary: string;
  category: string;
  hour: number;
} {
  const date = new Date(r.timestamp);
  const hour = date.getHours();

  switch (r.type) {
    case 'music':
      return {
        primary: `${r.artist} - ${r.title}`,
        category: r.lateNight ? 'Late Night Music' : 'Music',
        hour,
      };
    case 'ledger':
      return {
        primary: r.note,
        category: `${r.category}: ${r.subcategory}`,
        hour,
      };
    case 'card':
      return {
        primary: r.merchant ?? 'Unknown Merchant',
        category: r.category ?? 'Uncategorized Card',
        hour,
      };
    default:
      return assertNever(r);
  }
}

export function computePairScore(a: Receipt, b: Receipt): {
  score: number;
  strength: 'solid' | 'dashed';
  heuristicFactors: string[];
} {
  const factors: string[] = [];
  const { timeDiffHours, timeScore } = scoreTemporalProximity(a.timestamp, b.timestamp);
  factors.push(`Time offset: ${timeDiffHours < 1 ? '<1 hour' : `${Math.round(timeDiffHours)}h`}`);

  let affinityScore = 20;

  // Cross-channel synergy bonus (connecting different streams reveals true behavioral life patterns)
  if (a.type !== b.type) {
    affinityScore += 18;
    factors.push(`Cross-channel convergence (${a.type} ↔ ${b.type})`);
  } else {
    affinityScore += 8;
  }

  // Late night synergy
  const dateA = new Date(a.timestamp).getHours();
  const dateB = new Date(b.timestamp).getHours();
  const aLate = dateA >= 22 || dateA <= 4;
  const bLate = dateB >= 22 || dateB <= 4;
  if (aLate && bLate) {
    affinityScore += 16;
    factors.push('Synchronous nocturne (22:00-04:00 window)');
  }

  // High engagement bonus
  if (a.type === 'music' && !a.skipped && a.playedMs > 180000) {
    affinityScore += 6;
  }
  if (b.type === 'music' && !b.skipped && b.playedMs > 180000) {
    affinityScore += 6;
  }

  // Raw combined score
  const rawScore = Math.min(100, Math.round(timeScore + affinityScore));

  // Modulate by weakest confidence
  const minConfidence = Math.min(a.confidence, b.confidence);
  const adjustedScore = Math.max(15, Math.round(rawScore * (0.6 + 0.4 * minConfidence)));

  const strength: 'solid' | 'dashed' = adjustedScore >= 55 ? 'solid' : 'dashed';

  return {
    score: adjustedScore,
    strength,
    heuristicFactors: factors,
  };
}
