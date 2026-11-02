'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Gem, Star, X } from 'lucide-react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { initials } from '@/lib/format';
import type { Level } from '@/lib/types';

const avatarColors = ['bg-nar-100 text-nar-700', 'bg-xezer-100 text-xezer-700', 'bg-zefran-100 text-zefran-800', 'bg-lale-100 text-lale-700'];

export function Avatar({ name, url, size = 40, className, square }: { name: string; url?: string | null; size?: number; className?: string; square?: boolean }) {
  const color = avatarColors[(name.charCodeAt(0) + name.length) % avatarColors.length];
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center overflow-hidden border-2 border-ink bg-white font-display font-black', square ? 'rounded-xl' : 'rounded-full', !url && color, className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

export function Emoji({ name, size = 40, className, alt = '' }: { name: string; size?: number; className?: string; alt?: string }) {
  return <img src={`/emoji/${name}.webp`} width={size} height={size} alt={alt} className={clsx('select-none', className)} draggable={false} loading="lazy" />;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal>
          <motion.div
            className="absolute inset-0 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={clsx(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl border-[2.5px] border-ink bg-white shadow-lift sm:rounded-4xl',
              size === 'sm' && 'sm:max-w-md',
              size === 'md' && 'sm:max-w-xl',
              size === 'lg' && 'sm:max-w-3xl',
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b-[2.5px] border-ink bg-zefran-300 px-6 py-4">
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="btn-icon -mr-2" aria-label="close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function EmptyState({ emoji = 'package', title, sub, action }: { emoji?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border-[2.5px] border-dashed border-ink bg-white px-6 py-14 text-center">
      <motion.div initial={{ scale: 0.6, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <Emoji name={emoji} size={88} className="animate-float" />
      </motion.div>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      {sub && <p className="mt-2 max-w-sm text-ink-soft">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-zefran-400 text-zefran-400' : 'fill-ink/10 text-transparent'} />
      ))}
    </span>
  );
}

const levelStyle: Record<Level, string> = {
  newbie: 'bg-white text-ink',
  starter: 'bg-xezer-200 text-ink',
  trader: 'bg-lale-100 text-ink',
  master: 'bg-zefran-400 text-ink',
  legend: 'bg-nar-500 text-white',
};

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const t = useTranslations('level');
  return <span className={clsx('badge', levelStyle[level], className)}>{t(level)}</span>;
}

export function TrustBadges({ verified, plus, size = 16 }: { verified?: boolean; plus?: boolean; size?: number }) {
  const t = useTranslations('profile');
  return (
    <>
      {verified && (
        <span title={t('verifiedPhone')} className="inline-flex text-xezer-500">
          <BadgeCheck style={{ width: size, height: size }} />
        </span>
      )}
      {plus && (
        <span title={t('plusMember')} className="inline-flex text-lale-500">
          <Gem style={{ width: size, height: size }} />
        </span>
      )}
    </>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx('inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-r-transparent', className)} />;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border-[2.5px] border-ink bg-white px-4 py-3 transition hover:shadow-sm">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-mute">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors', checked ? 'bg-xezer-400' : 'bg-white')}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className={clsx('absolute top-[3px] h-[18px] w-[18px] rounded-full border-2 border-ink bg-white', checked ? 'right-[3px]' : 'left-[3px]')}
        />
      </button>
    </label>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}
