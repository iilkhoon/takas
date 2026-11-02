'use client';

import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Category } from '@/lib/types';
import { Emoji } from './ui';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const locale = useLocale() as 'az';
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 md:grid-cols-6 lg:grid-cols-8">
      {categories.map((c, i) => (
        <motion.div
          key={c.slug}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i, 16) * 0.025, duration: 0.4 }}
          className="snap-start"
        >
          <Link
            href={`/listings?category=${c.slug}`}
            className="group flex h-full w-[104px] flex-col items-center rounded-3xl border-[2.5px] border-ink bg-white px-2 pb-3 pt-4 text-center transition duration-200 shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-card sm:w-auto"
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink transition duration-300 group-hover:rotate-[-6deg]"
              style={{ backgroundColor: `${c.color}33` }}
            >
              <Emoji name={c.icon} size={44} />
            </span>
            <span className="mt-2.5 line-clamp-2 text-[12.5px] font-bold leading-tight text-ink">{c.name[locale] ?? c.name.az}</span>
            {typeof c.count === 'number' && <span className="mt-1 font-mono text-[11px] font-bold text-ink-mute">{c.count}</span>}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
