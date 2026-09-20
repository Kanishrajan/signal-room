/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReceiptType = 'music' | 'ledger' | 'card';

export interface MusicReceipt {
  id: string;
  type: 'music';
  timestamp: string;
  title: string;
  artist: string;
  album: string;
  playedMs: number;
  skipped: boolean;
  shuffle: boolean;
  confidence: number;
  source: 'spotify';
  lateNight?: boolean;
}

export interface LedgerReceipt {
  id: string;
  type: 'ledger';
  timestamp: string;
  note: string;
  category: string;
  subcategory: string;
  amount: number;
  direction: 'income' | 'expense';
  confidence: number;
  source: 'household';
}

export interface CardReceipt {
  id: string;
  type: 'card';
  timestamp: string;
  merchant: string | null;
  category: string | null;
  amount: number;
  city: string | null;
  isFraud: boolean;
  nullFieldCount: number;
  confidence: number;
  source: 'transactions';
}

export type Receipt = MusicReceipt | LedgerReceipt | CardReceipt;

export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  timestamp: string;
  score: number;
  strength: 'solid' | 'dashed';
  patternType: string;
  explanation: string;
  unlockedChapterId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  narrativeFragment: string;
  receiptIds: [string, string];
  theme: 'focus' | 'transition' | 'impulse' | 'night' | 'routine' | 'recovery';
  timestamp: string;
  unlockedOrder: number;
}

export interface ClusterEvaluation {
  score: number;
  strength: 'solid' | 'dashed';
  patternType: string;
  explanation: string;
  matchedChapter?: Omit<Chapter, 'unlockedOrder' | 'receiptIds'>;
}

export type ChannelFilter = 'all' | 'music' | 'ledger' | 'card';
