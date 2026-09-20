/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Receipt, Connection, Chapter } from '@/types/receipt';
import { ReceiptDetail } from '@/components/receipt/ReceiptDetail';
import { ConnectionLine } from '@/components/pattern/ConnectionLine';
import { ChapterCard } from '@/components/pattern/ChapterCard';
import { X, Layers, Radio, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SidePanelProps {
  focusedReceipt: Receipt | null;
  isNoise: boolean;
  onToggleNoise: () => void;
  onSelectAsNode: () => void;
  isSelectedA: boolean;
  isSelectedB: boolean;
  latestConnection: Connection | null;
  chapters: Chapter[];
  activeChapterId: string | null;
  onJumpToEvidence: (receiptIds: [string, string]) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  allReceipts: Receipt[];
}

export const SidePanel: React.FC<SidePanelProps> = ({
  focusedReceipt,
  isNoise,
  onToggleNoise,
  onSelectAsNode,
  isSelectedA,
  isSelectedB,
  latestConnection,
  chapters,
  activeChapterId,
  onJumpToEvidence,
  isOpenMobile,
  onCloseMobile,
  allReceipts,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'connection' | 'chapters'>('detail');

  const getReceiptName = (id: string) => {
    const r = allReceipts.find((rec) => rec.id === id);
    if (!r) return id;
    if (r.type === 'music') return r.title;
    if (r.type === 'ledger') return r.note;
    return r.merchant ?? 'Card';
  };

  return (
    <aside
      aria-label="Telemetry & Narrative Inspector"
      className={`inspector-panel flex flex-col ${
        isOpenMobile
          ? 'fixed z-40 lg:static lg:inset-auto lg:z-auto inspector-panel--open'
          : 'hidden lg:flex'
      }`}
    >
      {/* Panel Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('detail')}
            className={`min-h-[44px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
              activeTab === 'detail'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`min-h-[44px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
              activeTab === 'connection'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pattern ({latestConnection ? '1' : '0'})</span>
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`min-h-[44px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
              activeTab === 'chapters'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chapters ({chapters.length})</span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCloseMobile}
          className="lg:hidden min-h-[44px] w-11 p-0"
          aria-label="Close side panel"
        >
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      {/* Content Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {activeTab === 'detail' && (
          focusedReceipt ? (
            <ReceiptDetail
              receipt={focusedReceipt}
              isNoise={isNoise}
              onToggleNoise={onToggleNoise}
              onSelectAsNode={onSelectAsNode}
              isSelectedA={isSelectedA}
              isSelectedB={isSelectedB}
            />
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Select any receipt from the timeline to inspect metadata.
            </div>
          )
        )}

        {activeTab === 'connection' && (
          latestConnection ? (
            <ConnectionLine
              connection={latestConnection}
              sourceLabel={getReceiptName(latestConnection.sourceId)}
              targetLabel={getReceiptName(latestConnection.targetId)}
            />
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No active connection. Select two receipts and click Connect Nodes.
            </div>
          )
        )}

        {activeTab === 'chapters' && (
          chapters.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((ch) => (
                <ChapterCard
                  key={ch.id}
                  chapter={ch}
                  isActive={ch.id === activeChapterId}
                  onJumpToEvidence={() => onJumpToEvidence(ch.receiptIds)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Chapters remain locked. Connect receipt pairs to unlock life narrative milestones.
            </div>
          )
        )}
      </div>
    </aside>
  );
};
