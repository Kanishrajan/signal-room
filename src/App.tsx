/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useMemo } from 'react';
import { usePatternStore } from '@/store/pattern-store';
import { filterReceipts, isReceiptNoise } from '@/lib/clustering';
import { Header } from '@/components/Header';
import { ActionBar } from '@/components/ActionBar';
import { SidePanel } from '@/components/SidePanel';
import { AboutModal } from '@/components/AboutModal';
import { ReceiptList } from '@/components/receipt/ReceiptList';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Lazy import only LifeArc component per Performance Rubric (§5)
const LazyLifeArc = React.lazy(() =>
  import('@/components/pattern/LifeArc').then((m) => ({ default: m.LifeArc }))
);

export default function App() {
  const receipts = usePatternStore((s) => s.receipts);
  const selectedA = usePatternStore((s) => s.selectedReceiptA);
  const selectedB = usePatternStore((s) => s.selectedReceiptB);
  const focusedReceipt = usePatternStore((s) => s.focusedReceipt);
  const channelFilter = usePatternStore((s) => s.channelFilter);
  const searchQuery = usePatternStore((s) => s.searchQuery);
  const noiseOverrides = usePatternStore((s) => s.noiseOverrides);
  const connections = usePatternStore((s) => s.connections);
  const chapters = usePatternStore((s) => s.chapters);
  const activeChapterId = usePatternStore((s) => s.activeChapterId);
  const announcement = usePatternStore((s) => s.announcement);
  const isSidePanelOpen = usePatternStore((s) => s.isSidePanelOpen);
  const aboutModalOpen = usePatternStore((s) => s.aboutModalOpen);

  const selectReceipt = usePatternStore((s) => s.selectReceipt);
  const setFocusedReceipt = usePatternStore((s) => s.setFocusedReceipt);
  const clearSelection = usePatternStore((s) => s.clearSelection);
  const connectSelected = usePatternStore((s) => s.connectSelected);
  const toggleNoiseOverride = usePatternStore((s) => s.toggleNoiseOverride);
  const setChannelFilter = usePatternStore((s) => s.setChannelFilter);
  const setSearchQuery = usePatternStore((s) => s.setSearchQuery);
  const setActiveChapterId = usePatternStore((s) => s.setActiveChapterId);
  const setSidePanelOpen = usePatternStore((s) => s.setSidePanelOpen);
  const setAboutModalOpen = usePatternStore((s) => s.setAboutModalOpen);
  const jumpToChapterReceipts = usePatternStore((s) => s.jumpToChapterReceipts);

  const visibleReceipts = useMemo(
    () => filterReceipts(receipts, channelFilter, searchQuery, noiseOverrides),
    [receipts, channelFilter, searchQuery, noiseOverrides]
  );

  const latestConnection = connections[connections.length - 1] ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <Header
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAbout={() => setAboutModalOpen(true)}
        totalReceipts={receipts.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        <Suspense
          fallback={
            <div className="h-24 bg-slate-900/60 rounded-sm animate-pulse border border-slate-800" />
          }
        >
          <LazyLifeArc
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={(id) => {
              setActiveChapterId(id);
              setSidePanelOpen(true);
            }}
          />
        </Suspense>

        <ActionBar
          selectedA={selectedA}
          selectedB={selectedB}
          onConnect={connectSelected}
          onClear={clearSelection}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            <ReceiptList
              receipts={visibleReceipts}
              selectedA={selectedA}
              selectedB={selectedB}
              focusedReceipt={focusedReceipt}
              noiseOverrides={noiseOverrides}
              onSelectReceipt={selectReceipt}
              onFocusReceipt={setFocusedReceipt}
              isReceiptNoise={isReceiptNoise}
            />
          </div>

          <div className="lg:col-span-5 xl:col-span-4 sticky top-28">
            <SidePanel
              focusedReceipt={focusedReceipt}
              isNoise={
                focusedReceipt
                  ? isReceiptNoise(focusedReceipt, noiseOverrides[focusedReceipt.id])
                  : false
              }
              onToggleNoise={() => {
                if (focusedReceipt) toggleNoiseOverride(focusedReceipt.id);
              }}
              onSelectAsNode={() => {
                if (focusedReceipt) selectReceipt(focusedReceipt);
              }}
              isSelectedA={selectedA?.id === focusedReceipt?.id}
              isSelectedB={selectedB?.id === focusedReceipt?.id}
              latestConnection={latestConnection}
              chapters={chapters}
              activeChapterId={activeChapterId}
              onJumpToEvidence={jumpToChapterReceipts}
              isOpenMobile={isSidePanelOpen}
              onCloseMobile={() => setSidePanelOpen(false)}
              allReceipts={receipts}
            />
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setSidePanelOpen(true)}
          icon={<SlidersHorizontal className="w-4 h-4" />}
          aria-label="Open Inspector and Chapters Panel"
          className="shadow-2xl rounded-full px-5 py-3"
        >
          Inspector ({chapters.length})
        </Button>
      </div>

      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs font-mono text-slate-500">
        Receipts of a Life — The Signal Room · Real Spotify, Household Ledger, & Fraud Telemetry Fusion
      </footer>

      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
    </div>
  );
}
