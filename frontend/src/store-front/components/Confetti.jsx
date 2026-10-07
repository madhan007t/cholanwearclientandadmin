import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['bg-gold', 'bg-gold-light', 'bg-brand-black', 'bg-brand-white', 'bg-success/70'];
const rand = (min, max) => min + Math.random() * (max - min);

/** One-shot paper confetti falling top -> bottom. Transform/opacity only, unmounts itself when done. */
export default function Confetti({ duration = 3000 }) {
  const [done, setDone] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const pieces = useMemo(() => {
    const count = window.innerWidth < 640 ? 45 : 80;
    return Array.from({ length: count }, (_, i) => {
      const delay = rand(0, 0.7);
      return {
        id: i,
        color: COLORS[i % COLORS.length],
        style: {
          left: `${rand(0, 100)}%`,
          width: `${rand(5, 9)}px`,
          height: `${rand(8, 14)}px`,
          '--drift': `${rand(-60, 60)}px`,
          '--spin': `${rand(-540, 540)}deg`,
          '--delay': `${delay}s`,
          '--dur': `${rand(1.6, duration / 1000 - delay)}s`,
        },
      };
    });
  }, [duration]);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), duration + 100);
    return () => clearTimeout(t);
  }, [duration]);

  if (done) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} style={p.style} className={`absolute top-0 animate-confetti shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)] will-change-transform ${p.color}`} />
      ))}
    </div>,
    document.body
  );
}
