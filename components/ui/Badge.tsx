import React from 'react';
import { ReceiptType } from '@/types/receipt';

interface ChannelBadgeProps {
  type: ReceiptType;
  label?: string;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({
  type,
  label,
  size = 'md',
}) => {
  const shape = type === 'music' ? '●' : type === 'ledger' ? '■' : '▲';
  return (
    <span className={`track-badge track-badge--${size}`} aria-label={`${type} channel`}>
      <span className="track-badge__glyph" aria-hidden="true">{shape}</span>
      <span>{label ?? type}</span>
    </span>
  );
};
