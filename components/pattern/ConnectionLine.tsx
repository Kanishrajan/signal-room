/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Connection } from '@/types/receipt';
import { GitCommit, Sparkles } from 'lucide-react';

interface ConnectionLineProps {
  connection: Connection;
  sourceLabel: string;
  targetLabel: string;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceLabel,
  targetLabel,
}) => {
  const isSolid = connection.strength === 'solid';

  return (
    <div className="p-4 bg-slate-900/90 rounded-sm border border-slate-700/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <GitCommit className="w-4 h-4" />
          Pattern Synthesizer
        </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-slate-800 text-slate-300 border border-slate-700">
          Resonance: {connection.score}%
        </span>
      </div>

      {/* Static SVG representation with stroke style indicating strength */}
      <div className="relative py-2 px-1">
        <svg
          viewBox="0 0 300 40"
          className="w-full h-10 overflow-visible"
          aria-hidden="true"
        >
          {/* Base track */}
          <line
            x1="20"
            y1="20"
            x2="280"
            y2="20"
            stroke="rgb(51 65 85)"
            strokeWidth="2"
          />
          {/* Signal connection arc */}
          <path
            d="M 20 20 Q 150 -5 280 20"
            fill="none"
            stroke={isSolid ? 'rgb(34 211 238)' : 'rgb(245 158 11)'}
            strokeWidth={isSolid ? '2.5' : '1.5'}
            strokeDasharray={isSolid ? 'none' : '4 4'}
          />
          {/* Node endpoints */}
          <circle cx="20" cy="20" r="5" fill="rgb(34 211 238)" />
          <circle cx="280" cy="20" r="5" fill="rgb(34 211 238)" />
        </svg>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
          <span className="truncate max-w-[120px]" title={sourceLabel}>
            A: {sourceLabel}
          </span>
          <span className="truncate max-w-[120px] text-right" title={targetLabel}>
            B: {targetLabel}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/90 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{connection.patternType}</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          {connection.explanation}
        </p>
      </div>
    </div>
  );
};
