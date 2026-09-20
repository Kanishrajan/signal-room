/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Receipt } from '@/types/receipt';
import { ReceiptCard } from './ReceiptCard';

interface ReceiptListProps {
  receipts: Receipt[];
  selectedA: Receipt | null;
  selectedB: Receipt | null;
  focusedReceipt: Receipt | null;
  noiseOverrides: Record<string, boolean>;
  onSelectReceipt: (r: Receipt) => void;
  onFocusReceipt: (r: Receipt) => void;
  isReceiptNoise: (r: Receipt, override?: boolean) => boolean;
}

export const ReceiptList: React.FC<ReceiptListProps> = ({
  receipts,
  selectedA,
  selectedB,
  focusedReceipt,
  noiseOverrides,
  onSelectReceipt,
  onFocusReceipt,
  isReceiptNoise,
}) => {
  return (
    <section aria-label="Synchronized Receipts Timeline" className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>Showing {receipts.length} receipts</span>
        <span className="text-[11px] text-slate-500">
          Click or press Enter on 2 cards to connect
        </span>
      </div>

      <ul role="list" className="space-y-2.5">
        {receipts.length === 0 ? (
          <li className="py-16 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-sm border border-slate-800">
            No receipts matching current channel and query filter.
          </li>
        ) : (
          receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              isSelectedA={selectedA?.id === receipt.id}
              isSelectedB={selectedB?.id === receipt.id}
              isNoise={isReceiptNoise(receipt, noiseOverrides[receipt.id])}
              isFocused={focusedReceipt?.id === receipt.id}
              onSelect={() => onSelectReceipt(receipt)}
              onFocus={() => onFocusReceipt(receipt)}
            />
          ))
        )}
      </ul>
    </section>
  );
};
