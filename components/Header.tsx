/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChannelFilter } from '@/types/receipt';
import { Search, Info, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  channelFilter: ChannelFilter;
  onChannelChange: (ch: ChannelFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAbout: () => void;
  totalReceipts: number;
}

export const Header: React.FC<HeaderProps> = ({
  channelFilter,
  onChannelChange,
  searchQuery,
  onSearchChange,
  onOpenAbout,
  totalReceipts,
}) => {
  const channels: Array<{ id: ChannelFilter; label: string; glyph: string }> = [
    { id: 'all', label: 'All Streams', glyph: '○' },
    { id: 'music', label: 'Music', glyph: '●' },
    { id: 'ledger', label: 'Ledger', glyph: '■' },
    { id: 'card', label: 'Card', glyph: '▲' },
  ];

  return (
    <header className="signal-header sticky top-0 z-30">
      <div className="signal-header__inner">
        <div className="signal-brand">
          <div className="signal-brand__mark" aria-hidden="true">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1>RECEIPTS OF A LIFE</h1>
            <p>THE SIGNAL ROOM / {totalReceipts} RECEIPTS</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAbout}
          icon={<Info className="w-3.5 h-3.5" />}
          aria-label="About this data source fusion"
          className="header-about"
        >
          About data
        </Button>
      </div>

      <nav aria-label="Receipt Channels & Filters" className="signal-nav">
        <div className="signal-nav__inner">
          <div
            role="tablist"
            aria-label="Filter receipts by channel"
            className="channel-row"
          >
            {channels.map((ch) => {
              const active = channelFilter === ch.id;
              return (
                <button
                  key={ch.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChannelChange(ch.id)}
                  className={`channel-tab channel-tab--${ch.id} ${active ? 'is-active' : ''}`}
                >
                  <span className="channel-tab__glyph" aria-hidden="true">{ch.glyph}</span>
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          <div className="search-shell">
            <label htmlFor="receipt-search-input" className="sr-only">
              Search receipts
            </label>
            <Search className="search-shell__icon" aria-hidden="true" />
            <input
              id="receipt-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search receipts..."
              className="search-input"
            />
          </div>
        </div>
      </nav>
    </header>
  );
};
