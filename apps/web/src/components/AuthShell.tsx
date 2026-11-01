'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Emoji } from './ui';

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="container grid min-h-[calc(100vh-72px)] items-center gap-10 py-10 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-black">{title}</h1>
        <p className="mt-2 text-ink-soft">{sub}</p>
        <div className="mt-8">{children}</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative hidden overflow-hidden rounded-4xl bg-ink p-10 text-white lg:block"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-nar-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-xezer-500/30 blur-3xl" />
        <div className="relative grid grid-cols-3 gap-4">
          {['mobile_phone', 'video_game', 'guitar', 'bicycle', 'books', 'camera', 'teddy_bear', 'watch', 'laptop'].map((e, i) => (
            <motion.div
              key={e}
              className="flex aspect-square items-center justify-center rounded-3xl bg-white/10 backdrop-blur"
              animate={{ y: [0, i % 2 ? -8 : 8, 0] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
            >
              <Emoji name={e} size={64} />
            </motion.div>
          ))}
        </div>
        <ul className="relative mt-10 space-y-3">
          {[t('perk1'), t('perk2'), t('perk3')].map((p) => (
            <li key={p} className="flex items-center gap-3 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-xezer-500">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
