import React, { useMemo } from 'react';
import { Chapter } from '@/types/receipt';

interface LifeArcProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
}

export const LifeArc: React.FC<LifeArcProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
}) => {
  const arcData = useMemo(() => {
    if (!chapters.length) return null;

    const width = 760;
    const height = 150;
    const padX = 44;
    const yMap: Record<Chapter['theme'], number> = {
      focus: 46,
      transition: 92,
      impulse: 30,
      night: 120,
      routine: 76,
      recovery: 106,
    };

    const points = chapters.map((ch, index) => ({
      x: chapters.length === 1
        ? width / 2
        : padX + (index / (chapters.length - 1)) * (width - padX * 2),
      y: yMap[ch.theme] ?? 76,
      ch,
    }));

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      const control = (previous.x + current.x) / 2;
      pathD += ` C ${control} ${previous.y}, ${control} ${current.y}, ${current.x} ${current.y}`;
    }

    return { points, pathD, width, height };
  }, [chapters]);

  const assembled = chapters.length >= 3;

  return (
    <section
      aria-label="Life Arc: Unlocked Chapters Timeline"
      className={`life-arc ${assembled ? 'life-arc--assembled' : ''}`}
    >
      <div className="life-arc__head">
        <div>
          <span className="eyebrow">SYNTHESIS / LIFE ARC</span>
          <h2>{assembled ? 'Everything was connected.' : 'Life Arc'}</h2>
        </div>
        <span className="life-arc__count">{chapters.length} unlocked</span>
      </div>

      {!arcData ? (
        <div className="life-arc__empty">
          <span>ARC DORMANT</span>
          <p>Connect two receipts to reveal the first chapter.</p>
        </div>
      ) : (
        <div className="life-arc__canvas">
          <svg
            viewBox={`0 0 ${arcData.width} ${arcData.height}`}
            className="w-full min-w-[520px] h-32 overflow-visible"
            role="group"
            aria-label="Interactive timeline curve of unlocked chapters"
          >
            <line
              x1="20"
              y1="76"
              x2={arcData.width - 20}
              y2="76"
              className="life-arc__baseline"
            />
            <path d={arcData.pathD} className="life-arc__path" />
            {arcData.points.map((point, index) => {
              const active = point.ch.id === activeChapterId;
              return (
                <g key={point.ch.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={active ? 9 : 6}
                    className={`life-arc__node ${active ? 'is-active' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`Chapter ${index + 1}: ${point.ch.title}`}
                    onClick={() => onSelectChapter(point.ch.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectChapter(point.ch.id);
                      }
                    }}
                  />
                  <text
                    x={point.x}
                    y={point.y > 78 ? point.y - 15 : point.y + 21}
                    textAnchor="middle"
                    className="life-arc__label"
                  >
                    CH.{index + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {assembled && (
        <div className="life-arc__legend" aria-label="Track legend">
          <span><b className="legend-dot legend-dot--music">●</b> Music</span>
          <span><b className="legend-dot legend-dot--ledger">■</b> Ledger</span>
          <span><b className="legend-dot legend-dot--card">▲</b> Card</span>
        </div>
      )}
    </section>
  );
};
