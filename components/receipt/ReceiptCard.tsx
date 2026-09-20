import React from 'react';
import { Receipt, assertNever } from '@/types/receipt';
import { ChannelBadge } from '@/components/ui/Badge';
import { formatReceiptAmount, formatTimestamp } from '@/lib/clustering';

interface ReceiptCardProps {
  receipt: Receipt;
  isSelectedA: boolean;
  isSelectedB: boolean;
  isNoise: boolean;
  isFocused: boolean;
  onSelect: () => void;
  onFocus: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receipt,
  isSelectedA,
  isSelectedB,
  isNoise,
  isFocused,
  onSelect,
  onFocus,
}) => {
  const isSelected = isSelectedA || isSelectedB;
  const { date, time } = formatTimestamp(receipt.timestamp);
  const amountStr = formatReceiptAmount(receipt);

  let title = '';
  let subtitle = '';

  switch (receipt.type) {
    case 'music':
      title = receipt.title;
      subtitle = `${receipt.artist} / ${receipt.album}`;
      break;
    case 'ledger':
      title = receipt.note;
      subtitle = `${receipt.category} / ${receipt.subcategory}`;
      break;
    case 'card':
      title = receipt.merchant ?? 'Unlabeled terminal merchant';
      subtitle = `${receipt.category ?? 'Unclassified'} / ${receipt.city ?? 'Location unknown'}`;
      break;
    default:
      assertNever(receipt);
  }

  const stateClass = isSelected
    ? 'receipt-card--selected'
    : isNoise
      ? 'receipt-card--noise'
      : isFocused
        ? 'receipt-card--focused'
        : '';

  const selectionBadge = isSelectedA ? 'A' : isSelectedB ? 'B' : null;

  return (
    <li className="list-none w-full" role="listitem">
      <button
        type="button"
        onClick={onSelect}
        onFocus={onFocus}
        aria-pressed={isSelected}
        aria-label={`${receipt.type} receipt from ${date}: ${title}. ${selectionBadge ? `Selected as node ${selectionBadge}.` : ''} ${isNoise ? 'Flagged as low-confidence noise.' : ''}`}
        className={`receipt-card ${stateClass}`}
      >
        <div className="receipt-card__meta">
          <div className="flex items-center gap-2">
            <ChannelBadge type={receipt.type} size="sm" />
            {isNoise && <span className="receipt-noise">NOISE</span>}
            {receipt.type === 'music' && receipt.lateNight && (
              <span className="receipt-time-flag">LATE</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectionBadge && <span className="receipt-node">{selectionBadge}</span>}
            <span>{date} · {time}</span>
          </div>
        </div>

        <div className="receipt-card__body">
          <div className="min-w-0 flex-1">
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          {amountStr && <strong className="receipt-amount">{amountStr}</strong>}
        </div>
      </button>
    </li>
  );
};
