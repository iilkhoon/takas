'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Emoji } from '../ui';

const PAIRS: [string, string][] = [
  ['video_game', 'mobile_phone'],
  ['guitar', 'studio_microphone'],
  ['books', 'bicycle'],
  ['teddy_bear', 'kick_scooter'],
  ['laptop', 'camera'],
  ['handbag', 'watch'],
];

/** Ana səhifədəki animasiyalı "takas" vizualı */
export function HeroSwap() {
  const t = useTranslations('home');
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFlipped((f) => {
        if (f) setI((x) => (x + 1) % PAIRS.length);
        return !f;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const [a, b] = PAIRS[i];
  const left = flipped ? b : a;
  const right = flipped ? a : b;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* Fon dairələri */}
      <div className="absolute inset-[8%] rounded-full border-[3px] border-ink bg-zefran-300" />
      <div className="absolute inset-[18%] animate-spin-slow rounded-full border-[3px] border-dashed border-ink/10" />

      {/* Üzən kiçik emojilər */}
      {[
        { n: 'sparkles', c: 'left-[4%] top-[10%]', d: 0 },
        { n: 'red_heart', c: 'right-[6%] top-[6%]', d: 1.2 },
        { n: 'party_popper', c: 'left-[2%] bottom-[14%]', d: 0.6 },
        { n: 'star', c: 'right-[2%] bottom-[10%]', d: 1.8 },
        { n: 'handshake', c: 'left-[42%] top-[0%]', d: 2.4 },
      ].map((e) => (
        <motion.div
          key={e.n}
          className={`absolute ${e.c}`}
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: e.d, ease: 'easeInOut' }}
        >
          <Emoji name={e.n} size={52} />
        </motion.div>
      ))}

      {/* Takas kartları */}
      <div className="absolute inset-0 flex items-center justify-center gap-[6%]">
        {[left, right].map((name, idx) => (
          <motion.div
            key={name}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative flex aspect-[3/4] w-[34%] flex-col items-center justify-center rounded-[1.75rem] border-2 border-ink bg-white shadow-pop"
            style={{ rotate: idx === 0 ? -6 : 6 }}
          >
            <motion.div key={`${name}-e`} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
              <Emoji name={name} size={112} className="h-auto w-[70%] min-w-[64px] max-w-[112px]" />
            </motion.div>
            <span className={`absolute -bottom-3 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white ${idx === 0 ? 'bg-nar-500' : 'bg-xezer-500'}`}>
              {idx === 0 ? '⇄' : '✓'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Mərkəzdəki fırlanan ox */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-zefran-400 shadow-pop"
        animate={{ rotate: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10h13l-4-4" />
          <path d="M17 14H4l4 4" />
        </svg>
      </motion.div>
    </div>
  );
}
