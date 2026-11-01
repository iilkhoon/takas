import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/',
    path: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/',
    path: 'M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z',
  },
  {
    name: 'Telegram',
    href: 'https://t.me/',
    path: 'M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.1l-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/',
    path: 'M13.5 21.9v-7.7h2.6l.4-3h-3V9.3c0-.9.3-1.5 1.5-1.5h1.6V5.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6v7.7h3.1z',
  },
];

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const cols = [
    {
      title: t('footer.platform'),
      links: [
        { href: '/listings', label: t('nav.explore') },
        { href: '/discover', label: t('nav.discover') },
        { href: '/matches', label: t('nav.matches') },
        { href: '/listings/new', label: t('nav.post') },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { href: '/about', label: t('footer.about') },
        { href: '/pricing', label: t('footer.pricing') },
        { href: '/advertise', label: t('footer.advertise') },
      ],
    },
    {
      title: t('footer.help'),
      links: [
        { href: '/safety', label: t('footer.safety') },
        { href: '/terms', label: t('footer.terms') },
        { href: '/privacy', label: t('footer.privacy') },
      ],
    },
  ];
  return (
    <footer className="relative mt-20 overflow-hidden bg-ink pb-24 pt-16 text-white/80 md:pb-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-nar-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-xezer-500/15 blur-3xl" />
      <div className="container relative">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{t('brand.description')}</p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:-translate-y-0.5 hover:bg-nar-500"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/60 transition hover:text-zefran-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} Dəyiş. {t('footer.rights')}
          </span>
          <span>{t('footer.made')}</span>
        </div>
      </div>
    </footer>
  );
}
