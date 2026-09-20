/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Receipt, assertNever } from '@/types/receipt';
import { ChannelBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatReceiptAmount, formatTimestamp } from '@/lib/clustering';
import { Radio, AlertTriangle } from 'lucide-react';

interface ReceiptDetailProps {
  receipt: Receipt;
  isNoise: boolean;
  onToggleNoise: () => void;
  onSelectAsNode: () => void;
  isSelectedA: boolean;
  isSelectedB: boolean;
}

export const ReceiptDetail: React.FC<ReceiptDetailProps> = ({
  receipt,
  isNoise,
  onToggleNoise,
  onSelectAsNode,
  isSelectedA,
  isSelectedB,
}) => {
  const { date, time } = formatTimestamp(receipt.timestamp);
  const amountStr = formatReceiptAmount(receipt);
  const isSelected = isSelectedA || isSelectedB;

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ChannelBadge type={receipt.type} />
          <span className="text-xs font-mono text-slate-400">ID: {receipt.id}</span>
        </div>
        <span className="text-xs font-mono text-slate-400">{date} · {time}</span>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          {getPrimaryTitle(receipt)}
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Source Stream: <span className="text-slate-300 font-semibold">{receipt.source.toUpperCase()}</span>
        </p>
      </div>

      <div className="p-3 bg-slate-950/60 rounded-xs border border-slate-800 space-y-2 text-xs font-mono">
        <DetailRows receipt={receipt} amountStr={amountStr} />
      </div>

      {/* Signal / Noise Classification Controls */}
      <div className="p-3 bg-slate-900/90 rounded-xs border border-slate-700/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Signal State:
          </span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-xs ${
              isNoise
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isNoise ? 'NOISE (LOW CONFIDENCE)' : 'CLEAN SIGNAL'}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          Confidence index: {Math.round(receipt.confidence * 100)}%.{' '}
          {receipt.type === 'card' && receipt.isFraud && (
            <span className="text-red-400 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Fraud detection flag triggered.
            </span>
          )}
        </p>

        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleNoise}
          className="w-full text-xs"
        >
          {isNoise ? 'Promote to Confirmed Signal' : 'Reclassify as Background Noise'}
        </Button>
      </div>

      <Button
        variant={isSelected ? 'ghost' : 'primary'}
        size="md"
        onClick={onSelectAsNode}
        className="w-full"
      >
        {isSelected ? 'Remove from Node Selection' : 'Select for Pattern Correlation'}
      </Button>
    </div>
  );
};

function getPrimaryTitle(r: Receipt): string {
  switch (r.type) {
    case 'music':
      return r.title;
    case 'ledger':
      return r.note;
    case 'card':
      return r.merchant ?? 'Unspecified Terminal Merchant';
    default:
      return assertNever(r);
  }
}

function DetailRows({ receipt, amountStr }: { receipt: Receipt; amountStr: string | null }) {
  switch (receipt.type) {
    case 'music':
      return (
        <>
          <div className="flex justify-between"><span className="text-slate-500">Artist:</span><span>{receipt.artist}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Album:</span><span>{receipt.album}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Duration:</span><span>{amountStr}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Skipped:</span><span>{receipt.skipped ? 'Yes (Weak signal)' : 'No (Engaged)'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Shuffle:</span><span>{receipt.shuffle ? 'Active' : 'Linear playback'}</span></div>
        </>
      );
    case 'ledger':
      return (
        <>
          <div className="flex justify-between"><span className="text-slate-500">Category:</span><span>{receipt.category}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Subcategory:</span><span>{receipt.subcategory}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Flow:</span><span>{receipt.direction.toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="text-cyan-400 font-bold">{amountStr}</span></div>
        </>
      );
    case 'card':
      return (
        <>
          <div className="flex justify-between"><span className="text-slate-500">Category:</span><span>{receipt.category ?? 'None'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">City:</span><span>{receipt.city ?? 'None'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Null Fields:</span><span>{receipt.nullFieldCount}/5</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="text-cyan-400 font-bold">{amountStr}</span></div>
        </>
      );
    default:
      return assertNever(receipt);
  }
}
