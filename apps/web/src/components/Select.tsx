'use client';

import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={clsx('relative', className)}>
      <select {...props} className="input cursor-pointer appearance-none pr-10 font-semibold">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
    </div>
  );
}
