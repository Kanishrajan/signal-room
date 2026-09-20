/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Chapter } from '@/types/receipt';
import { Button } from '@/components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';

interface ChapterCardProps {
  chapter: Chapter;
  onJumpToEvidence: () => void;
  isActive?: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onJumpToEvidence,
  isActive = false,
}) => {
  const themeColors = {
    focus: 'border-l-cyan-400 bg-cyan-950/20',
    transition: 'border-l-indigo-400 bg-indigo-950/20',
    impulse: 'border-l-amber-400 bg-amber-950/20',
    night: 'border-l-purple-400 bg-purple-950/20',
    routine: 'border-l-emerald-400 bg-emerald-950/20',
    recovery: 'border-l-rose-400 bg-rose-950/20',
  }[chapter.theme];

  return (
    <article
      className={`chapter-card chapter-unlock ${themeColors} ${
        isActive ? 'chapter-card--active' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          Chapter #{chapter.unlockedOrder}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded-xs bg-slate-900/90 border border-slate-700">
          {chapter.theme}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-100 mb-0.5">
          {chapter.title}
        </h4>
        <p className="text-xs text-slate-400 font-mono">
          {chapter.subtitle}
        </p>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xs border border-slate-800/80">
        "{chapter.narrativeFragment}"
      </p>

      <Button
        variant="secondary"
        size="sm"
        onClick={onJumpToEvidence}
        icon={<Compass className="w-3.5 h-3.5 text-cyan-400" />}
        className="w-full text-xs"
      >
        Inspect Evidence Nodes (A & B)
      </Button>
    </article>
  );
};
