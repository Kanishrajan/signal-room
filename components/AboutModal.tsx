/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Database, ShieldCheck, Zap } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About This Telemetry Fusion" maxWidth="max-w-2xl">
      <div className="space-y-4 font-sans text-xs sm:text-sm text-slate-300">
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-sm">
          <h3 className="font-mono font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-cyan-400" />
            Ground Truth: Three Real Telemetry Sources
          </h3>
          <p className="text-slate-300 leading-relaxed">
            This timeline is not fictionalized mock data. It fuses three genuine exports into a unified temporal register:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs text-slate-300">
            <li><strong className="text-cyan-300">Spotify Listening History:</strong> Track playback, ms_played, skip behavior, and shuffle flags.</li>
            <li><strong className="text-emerald-300">Household Spending Ledger:</strong> Self-reported expenses, incomes, categories, and personal notes.</li>
            <li><strong className="text-amber-300">Card Transactions & Fraud Log:</strong> Terminal merchant logs, null field density, and verified <code className="text-red-300">is_fraud</code> flags.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Deterministic Signal vs. Noise Seeding
          </h4>
          <p className="text-slate-400 leading-relaxed mb-2">
            The dotted "noise" borders and reduced opacity are not cosmetic filters. They are calculated deterministically at build-time:
          </p>
          <div className="bg-slate-950 p-3 rounded-xs border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <p><span className="text-amber-400">Card Confidence:</span> <code className="text-slate-200">is_fraud ? 0.2 : 1 - (nullFieldCount / 5)</code></p>
            <p><span className="text-cyan-400">Music Confidence:</span> <code className="text-slate-200">skipped ? 0.5 : 1.0</code> (skipped tracks indicate passive disengagement)</p>
            <p><span className="text-emerald-400">Ledger Confidence:</span> <code className="text-slate-200">1.0</code> (authoritative self-logged personal accounts)</p>
          </div>
        </div>

        <div>
          <h4 className="font-mono font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Pattern Clustering Engine
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Selecting two receipts triggers deterministic heuristic resonance scoring based on temporal proximity, cross-channel convergence, nocturnal synchrony, and confidence weighting. Connected clusters unlock narrative chapter milestones on the persistent Life Arc.
          </p>
        </div>
      </div>
    </Modal>
  );
};
