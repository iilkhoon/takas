import clsx from 'clsx';

export function LogoMark({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={clsx('shrink-0', className)} aria-hidden>
      <rect width="48" height="48" rx="14" fill="#E8334A" />
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={clsx(spin && 'origin-center transition-transform duration-700 group-hover:rotate-180')}
        style={{ transformBox: 'fill-box' }}
      >
        <path d="M13.5 21.5A11 11 0 0 1 33 16" />
        <path d="M33 9.5V16h-6.5" />
        <path d="M34.5 26.5A11 11 0 0 1 15 32" />
        <path d="M15 38.5V32h6.5" />
      </g>
      <circle cx="24" cy="24" r="3.2" fill="#FFC21F" />
    </svg>
  );
}

/** "dəyiş" söz nişanı — "ə" hərfi brendin imzasıdır */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={clsx('group inline-flex items-center gap-2', className)}>
      <LogoMark className="h-9 w-9" spin />
      <span className={clsx('font-display text-[1.6rem] font-black leading-none tracking-tight', light ? 'text-white' : 'text-ink')}>
        d<span className="text-nar-500">ə</span>yiş
      </span>
    </span>
  );
}
