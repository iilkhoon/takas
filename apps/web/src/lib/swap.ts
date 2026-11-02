import { ArrowDownLeft, ArrowUpRight, Scale, Shuffle } from 'lucide-react';
import type { SwapType } from './types';

/** Takas növlərinin rəng + ikonu (server və client komponentlərində istifadə olunur) */
export const SWAP_STYLE: Record<SwapType, { cls: string; icon: typeof Scale }> = {
  EVEN: { cls: 'bg-lale-500 text-white', icon: Scale },
  PAY_EXTRA: { cls: 'bg-xezer-400 text-ink', icon: ArrowUpRight },
  WANT_EXTRA: { cls: 'bg-zefran-400 text-ink', icon: ArrowDownLeft },
  ANY: { cls: 'bg-white text-ink', icon: Shuffle },
};
