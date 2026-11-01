'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import clsx from 'clsx';
import type { Image } from '@/lib/types';

export function Gallery({ images, title, badges }: { images: Image[]; title: string; badges?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [zoom, setZoom] = useState(false);
  const n = images.length;
  const go = useCallback(
    (d: number) => {
      setDir(d);
      setI((x) => (x + d + n) % n);
    },
    [n],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') setZoom(false);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [go]);

  if (!n) return null;
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-4xl border border-line bg-cream-deep">
        <AnimatePresence initial={false} custom={dir}>
          <motion.img
            key={images[i].url}
            src={images[i].url}
            alt={`${title} ${i + 1}`}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dir * 60 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            drag={n > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            className="absolute inset-0 h-full w-full cursor-grab object-cover active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>
        <div className="absolute left-4 top-4 flex gap-1.5">{badges}</div>
        <button onClick={() => setZoom(true)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-110" aria-label="zoom">
          <Expand className="h-[18px] w-[18px]" />
        </button>
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-card transition hover:scale-110" aria-label="prev">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-card transition hover:scale-110" aria-label="next">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink/40 px-2 py-1.5 backdrop-blur">
              {images.map((_, k) => (
                <span key={k} className={clsx('h-1.5 rounded-full bg-white transition-all', k === i ? 'w-5' : 'w-1.5 opacity-60')} />
              ))}
            </div>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((im, k) => (
            <button
              key={im.url}
              onClick={() => {
                setDir(k > i ? 1 : -1);
                setI(k);
              }}
              className={clsx('h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition', k === i ? 'border-nar-500' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <img src={im.thumbUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoom && (
          <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(false)}>
            <img src={images[i].url} alt={title} className="max-h-full max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="close">
              <X className="h-6 w-6" />
            </button>
            {n > 1 && (
              <>
                <button onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" aria-label="prev">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" aria-label="next">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
