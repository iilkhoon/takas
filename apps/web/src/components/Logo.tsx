import clsx from 'clsx';

/** Neobrutal loqo nişanı: sarı kvadrat, qalın qara kontur, sərt kölgə, takas oxları */
export function LogoMark({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={clsx('shrink-0 overflow-visible', className)} aria-hidden>
      <rect x="4" y="4" width="42" height="42" rx="9" fill="#0B0B0F" />
      <rect x="1.5" y="1.5" width="42" height="42" rx="9" fill="#FFDB1F" stroke="#0B0B0F" strokeWidth="3" />
      <g
        fill="none"
        stroke="#0B0B0F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={clsx(spin && 'origin-center transition-transform duration-500 group-hover:rotate-180')}
        style={{ transformBox: 'fill-box' }}
      >
        <path d="M11.5 20A11 11 0 0 1 31 14.5" />
        <path d="M31 8v6.5h-6.5" />
        <path d="M33.5 25A11 11 0 0 1 14 30.5" />
        <path d="M14 37v-6.5h6.5" />
      </g>
      <circle cx="22.5" cy="22.5" r="3.4" fill="#FF2E63" stroke="#0B0B0F" strokeWidth="1.5" />
    </svg>
  );
}

/** "dəyiş" söz nişanı — "ə" hərfi brendin imzasıdır */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={clsx('group inline-flex items-center gap-2', className)}>
      <LogoMark className="h-9 w-9" spin />
      <span className={clsx('font-display text-[1.65rem] font-black leading-none tracking-tight', light ? 'text-white' : 'text-ink')}>
        d<span className={light ? 'text-zefran-400' : 'text-nar-500'}>ə</span>yiş
      </span>
    </span>
  );
}
