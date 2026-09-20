/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import initialReceipts from '@/data/receipts.json';
import {
  Receipt,
  Connection,
  Chapter,
  ChannelFilter,
} from '@/types/receipt';
import { evaluateCluster, isReceiptNoise } from '@/lib/clustering';

interface PatternState {
  receipts: Receipt[];
  selectedReceiptA: Receipt | null;
  selectedReceiptB: Receipt | null;
  focusedReceipt: Receipt | null;
  channelFilter: ChannelFilter;
  searchQuery: string;
  noiseOverrides: Record<string, boolean>;
  connections: Connection[];
  chapters: Chapter[];
  activeChapterId: string | null;
  announcement: string;
  isSidePanelOpen: boolean;
  aboutModalOpen: boolean;

  // Actions
  selectReceipt: (receipt: Receipt) => void;
  setFocusedReceipt: (receipt: Receipt | null) => void;
  clearSelection: () => void;
  connectSelected: () => void;
  toggleNoiseOverride: (receiptId: string) => void;
  setChannelFilter: (filter: ChannelFilter) => void;
  setSearchQuery: (query: string) => void;
  setActiveChapterId: (id: string | null) => void;
  setSidePanelOpen: (open: boolean) => void;
  setAboutModalOpen: (open: boolean) => void;
  jumpToChapterReceipts: (receiptIds: [string, string]) => void;
  clearAnnouncement: () => void;
}

export const usePatternStore = create<PatternState>((set, get) => ({
  receipts: initialReceipts as Receipt[],
  selectedReceiptA: null,
  selectedReceiptB: null,
  focusedReceipt: (initialReceipts[0] as Receipt) ?? null,
  channelFilter: 'all',
  searchQuery: '',
  noiseOverrides: {},
  connections: [],
  chapters: [],
  activeChapterId: null,
  announcement: 'Signal Room initialized. Select two receipts to discover behavioral patterns.',
  isSidePanelOpen: false,
  aboutModalOpen: false,

  selectReceipt: (receipt: Receipt) => {
    const { selectedReceiptA, selectedReceiptB } = get();

    if (!selectedReceiptA) {
      set({
        selectedReceiptA: receipt,
        focusedReceipt: receipt,
        announcement: `Selected first receipt: ${getReceiptSummary(receipt)}. Choose a second receipt to connect.`,
      });
      return;
    }

    if (selectedReceiptA.id === receipt.id) {
      // Toggle off A
      set({
        selectedReceiptA: null,
        announcement: `Deselected ${getReceiptSummary(receipt)}.`,
      });
      return;
    }

    if (!selectedReceiptB) {
      set({
        selectedReceiptB: receipt,
        focusedReceipt: receipt,
        announcement: `Selected second receipt: ${getReceiptSummary(receipt)}. Ready to connect.`,
      });
      return;
    }

    if (selectedReceiptB.id === receipt.id) {
      // Toggle off B
      set({
        selectedReceiptB: null,
        announcement: `Deselected second receipt.`,
      });
      return;
    }

    // Replace B with new selection
    set({
      selectedReceiptB: receipt,
      focusedReceipt: receipt,
      announcement: `Replaced second receipt with ${getReceiptSummary(receipt)}. Ready to connect.`,
    });
  },

  setFocusedReceipt: (receipt) => set({ focusedReceipt: receipt }),

  clearSelection: () =>
    set({
      selectedReceiptA: null,
      selectedReceiptB: null,
      announcement: 'Receipt selection cleared.',
    }),

  connectSelected: () => {
    const { selectedReceiptA, selectedReceiptB, connections, chapters } = get();
    if (!selectedReceiptA || !selectedReceiptB) {
      return;
    }

    // Pattern evaluation ONLY happens here on connect action
    const evaluation = evaluateCluster(selectedReceiptA, selectedReceiptB);

    const connectionId = `conn-${selectedReceiptA.id}-${selectedReceiptB.id}`;
    let chapterId: string | undefined = undefined;
    let newChapters = [...chapters];

    if (evaluation.matchedChapter) {
      const existingChapter = chapters.find((c) => c.id === evaluation.matchedChapter?.id);
      if (!existingChapter) {
        const chapter: Chapter = {
          ...evaluation.matchedChapter,
          receiptIds: [selectedReceiptA.id, selectedReceiptB.id],
          unlockedOrder: chapters.length + 1,
        };
        newChapters = [...chapters, chapter];
        chapterId = chapter.id;
      } else {
        chapterId = existingChapter.id;
      }
    }

    const newConnection: Connection = {
      id: connectionId,
      sourceId: selectedReceiptA.id,
      targetId: selectedReceiptB.id,
      timestamp: new Date().toISOString(),
      score: evaluation.score,
      strength: evaluation.strength,
      patternType: evaluation.patternType,
      explanation: evaluation.explanation,
      unlockedChapterId: chapterId,
    };

    // Filter out duplicates if reconnected
    const updatedConnections = [
      ...connections.filter((c) => c.id !== connectionId),
      newConnection,
    ];

    set({
      connections: updatedConnections,
      chapters: newChapters,
      activeChapterId: chapterId ?? null,
      isSidePanelOpen: true,
      announcement: `Connection established. Pattern detected: ${evaluation.patternType}. Chapter unlocked: ${evaluation.matchedChapter?.title ?? 'Resonance Arc'}.`,
    });
  },

  toggleNoiseOverride: (receiptId: string) => {
    const { receipts, noiseOverrides } = get();
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    const currentNoise = isReceiptNoise(receipt, noiseOverrides[receiptId]);
    const updatedOverrides = {
      ...noiseOverrides,
      [receiptId]: !currentNoise,
    };

    set({
      noiseOverrides: updatedOverrides,
      announcement: `Reclassified receipt ${receiptId} to ${!currentNoise ? 'Noise' : 'Signal'}.`,
    });
  },

  setChannelFilter: (channelFilter) =>
    set({
      channelFilter,
      announcement: `Filter set to ${channelFilter} channel.`,
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setActiveChapterId: (activeChapterId) => set({ activeChapterId }),

  setSidePanelOpen: (isSidePanelOpen) => set({ isSidePanelOpen }),

  setAboutModalOpen: (aboutModalOpen) => set({ aboutModalOpen }),

  jumpToChapterReceipts: (receiptIds) => {
    const { receipts } = get();
    const a = receipts.find((r) => r.id === receiptIds[0]) ?? null;
    const b = receipts.find((r) => r.id === receiptIds[1]) ?? null;
    set({
      selectedReceiptA: a,
      selectedReceiptB: b,
      focusedReceipt: a,
      announcement: `Focused on evidence receipts for chapter.`,
    });
  },

  clearAnnouncement: () => set({ announcement: '' }),
}));

function getReceiptSummary(r: Receipt): string {
  switch (r.type) {
    case 'music':
      return `${r.title} by ${r.artist}`;
    case 'ledger':
      return r.note;
    case 'card':
      return r.merchant ?? 'Card Transaction';
  }
}
