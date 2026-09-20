import React from 'react';
import { Receipt } from '@/types/receipt';
import { Button } from '@/components/ui/Button';
import { Zap, X, ArrowRight } from 'lucide-react';

interface ActionBarProps {
  selectedA: Receipt | null;
  selectedB: Receipt | null;
  onConnect: () => void;
  onClear: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedA,
  selectedB,
  onConnect,
  onClear,
}) => {
  const canConnect = selectedA !== null && selectedB !== null;

  return (
    <section aria-label="Selection and Pattern Synthesizer Controls" className="connect-console">
      <div className="connect-console__nodes">
        <NodeSlot label="Node A" value={selectedA ? getShortLabel(selectedA) : 'Select receipt'} />
        <ArrowRight className="connect-console__arrow" aria-hidden="true" />
        <NodeSlot label="Node B" value={selectedB ? getShortLabel(selectedB) : 'Select receipt'} />
      </div>

      <div className="connect-console__actions">
        {(selectedA || selectedB) && (
          <Button
            variant="ghost"
            size="md"
            onClick={onClear}
            icon={<X className="w-3.5 h-3.5" />}
            aria-label="Clear selected receipts"
          >
            Clear
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          onClick={onConnect}
          disabled={!canConnect}
          icon={<Zap className="w-4 h-4" />}
          aria-label="Connect selected receipts and evaluate cluster pattern"
          className="connect-button"
        >
          Connect
        </Button>
      </div>
    </section>
  );
};

function NodeSlot({ label, value }: { label: string; value: string }) {
  return (
    <div className="node-slot">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getShortLabel(r: Receipt): string {
  switch (r.type) {
    case 'music':
      return r.title;
    case 'ledger':
      return r.note;
    case 'card':
      return r.merchant ?? 'Card transaction';
  }
}
