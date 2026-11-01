import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Plus, ShieldCheck, Scale, Sparkles, Gift, Leaf, Smartphone, Gem, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { serverApi } from '@/lib/server-api';
import type { ListingCard as TCard, Meta } from '@/lib/types';
import { HeroSwap } from '@/components/home/HeroSwap';
import { Reveal, CountUp } from '@/components/home/Reveal';
import { CategoryGrid } from '@/components/CategoryStrip';
import { ListingGrid } from '@/components/ListingCard';
import { AdSlot } from '@/components/AdSlot';
import { Emoji } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface HomeData {
  vip: TCard[];
  latest: TCard[];
  popular: TCard[];
  stats: { listings: number; trades: number; users: number };
}

function SectionHead({ title, sub, href, cta }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="mt-1.5 text-ink-soft">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="btn btn-ghost btn-sm shrink-0">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [home, meta] = await Promise.all([serverApi<HomeData>('/listings/home'), serverApi<Meta>('/meta', { revalidate: 60 })]);
  const stats = home?.stats ?? { listings: 0, trades: 0, users: 0 };

  const steps = [
    { e: 'camera_with_flash', t: t('home.how1t'), d: t('home.how1d'), c: 'bg-nar-50' },
    { e: 'wrapped_gift', t: t('home.how2t'), d: t('home.how2d'), c: 'bg-zefran-50' },
    { e: 'speech_balloon', t: t('home.how3t'), d: t('home.how3d'), c: 'bg-lale-50' },
    { e: 'handshake', t: t('home.how4t'), d: t('home.how4d'), c: 'bg-xezer-50' },
  ];
  const whys = [
    { icon: Sparkles, t: t('home.why1t'), d: t('home.why1d'), c: 'text-nar-500 bg-nar-50' },
    { icon: Scale, t: t('home.why2t'), d: t('home.why2d'), c: 'text-lale-500 bg-lale-50' },
    { icon: ShieldCheck, t: t('home.why3t'), d: t('home.why3d'), c: 'text-xezer-600 bg-xezer-50' },
    { icon: Gift, t: t('home.why4t'), d: t('home.why4d'), c: 'text-zefran-700 bg-zefran-50' },
  ];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="container relative grid items-center gap-10 pb-12 pt-8 md:grid-cols-[1.1fr_1fr] md:pb-20 md:pt-14">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide shadow-[0_3px_0_0_#14121F]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xezer-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-xezer-500" />
                </span>
                {t('home.heroBadge')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-6 text-[2.6rem] font-black leading-[1.02] sm:text-6xl lg:text-7xl">
                {t('home.heroTitle1')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-nar-500">{t('home.heroTitleSwap')}</span>
                  <svg className="absolute -bottom-2 left-0 z-0 h-4 w-full text-zefran-400" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden>
                    <path d="M2 11c40-8 90-10 196-4" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                ,<br />
                {t('home.heroTitle2')}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{t('home.heroSub')}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/listings/new" className="btn btn-primary btn-lg">
                  <Plus className="h-5 w-5" strokeWidth={3} />
                  {t('home.ctaPost')}
                </Link>
                <Link href="/listings" className="btn btn-outline btn-lg">
                  {t('home.ctaExplore')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {[
                  { v: stats.listings, l: t('home.statListings') },
                  { v: stats.trades, l: t('home.statTrades') },
                  { v: stats.users, l: t('home.statUsers') },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="sr-only">{s.l}</dt>
                    <dd className="font-display text-2xl font-black sm:text-3xl">
                      <CountUp value={s.v} />
                      <span className="text-nar-500">+</span>
                    </dd>
                    <div className="text-xs font-semibold text-ink-mute sm:text-sm">{s.l}</div>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={40}>
            <HeroSwap />
          </Reveal>
        </div>

        {/* Kayan zolaq */}
        <div className="relative -rotate-1 border-y-2 border-ink bg-zefran-400 py-3">
          <div className="flex w-max animate-marquee whitespace-nowrap font-display text-sm font-bold uppercase tracking-wide">
            <span className="px-4">{t('home.marquee')}</span>
            <span className="px-4">{t('home.marquee')}</span>
            <span className="px-4" aria-hidden>
              {t('home.marquee')}
            </span>
            <span className="px-4" aria-hidden>
              {t('home.marquee')}
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- KATEQORİYALAR ---------------- */}
      <section className="container pt-14">
        <SectionHead title={t('home.categoriesTitle')} href="/listings" cta={t('common.seeAll')} />
        {meta && <CategoryGrid categories={meta.categories} />}
      </section>

      {/* ---------------- VIP ---------------- */}
      {home && home.vip.length > 0 && (
        <section className="container pt-14">
          <div className="rounded-4xl bg-gradient-to-br from-zefran-100 via-zefran-50 to-white p-4 ring-1 ring-zefran-200 sm:p-6">
            <SectionHead title={`⭐ ${t('home.vipTitle')}`} sub={t('home.vipSub')} href="/pricing" cta="VIP?" />
            <ListingGrid items={home.vip.slice(0, 4)} />
          </div>
        </section>
      )}

      {/* ---------------- YENİ ELANLAR ---------------- */}
      {home && (
        <section className="container pt-14">
          <SectionHead title={t('home.latestTitle')} sub={t('home.latestSub')} href="/listings" cta={t('common.seeAll')} />
          <ListingGrid items={home.latest.slice(0, 8)} />
        </section>
      )}

      <div className="container pt-10">
        <AdSlot placement="home_top" />
      </div>

      {/* ---------------- NECƏ İŞLƏYİR ---------------- */}
      <section className="container pt-20">
        <Reveal>
          <h2 className="section-title text-center">{t('home.howTitle')}</h2>
        </Reveal>
        <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="card relative h-full p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="absolute right-5 top-4 font-display text-5xl font-black text-ink/[.06]">{i + 1}</span>
                <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${s.c}`}>
                  <Emoji name={s.e} size={44} />
                </span>
                <h3 className="mt-5 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- KƏŞF ET PROMO ---------------- */}
      <section className="container pt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-nar-500/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-lale-500/30 blur-3xl" />
            <div className="relative grid items-center gap-10 md:grid-cols-2">
              <div>
                <span className="badge bg-nar-500 text-white">🔥 New</span>
                <h2 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">{t('home.discoverTitle')}</h2>
                <p className="mt-4 max-w-md text-white/70">{t('home.discoverSub')}</p>
                <Link href="/discover" className="btn btn-primary btn-lg mt-8">
                  {t('home.discoverCta')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="relative mx-auto h-72 w-56">
                {[
                  { e: 'laptop', r: -12, x: -40, bg: 'bg-xezer-100' },
                  { e: 'guitar', r: 8, x: 40, bg: 'bg-zefran-100' },
                  { e: 'kick_scooter', r: -2, x: 0, bg: 'bg-nar-100' },
                ].map((c, i) => (
                  <div
                    key={c.e}
                    className={`absolute inset-0 flex flex-col items-center justify-center rounded-4xl border-4 border-white ${c.bg} shadow-lift`}
                    style={{ transform: `translateX(${c.x}px) rotate(${c.r}deg)`, zIndex: i }}
                  >
                    <Emoji name={c.e} size={120} className={i === 2 ? 'animate-float' : ''} />
                  </div>
                ))}
                <span className="absolute -left-6 bottom-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-lift">✕</span>
                <span className="absolute -right-6 bottom-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-nar-500 text-2xl shadow-lift">❤</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- NİYƏ DƏYİŞ ---------------- */}
      <section className="container pt-20">
        <Reveal>
          <h2 className="section-title text-center">{t('home.whyTitle')}</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whys.map((w, i) => (
            <Reveal key={w.t} delay={i * 0.06}>
              <div className="h-full rounded-3xl border border-line bg-white p-6">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${w.c}`}>
                  <w.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-bold">{w.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{w.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- POPULYAR ---------------- */}
      {home && home.popular.length > 0 && (
        <section className="container pt-20">
          <SectionHead title={t('home.popularTitle')} sub={t('home.popularSub')} href="/listings?sort=popular" cta={t('common.seeAll')} />
          <ListingGrid items={home.popular.slice(0, 4)} />
        </section>
      )}

      {/* ---------------- PLUS + TƏHLÜKƏSİZLİK ---------------- */}
      <section className="container grid gap-4 pt-20 lg:grid-cols-2">
        <Reveal className="h-full">
          <div className="relative h-full overflow-hidden rounded-4xl bg-gradient-to-br from-lale-500 to-lale-700 p-8 text-white">
            <Emoji name="gem_stone" size={120} className="absolute -right-4 -top-4 rotate-12 opacity-90" />
            <Gem className="h-8 w-8 text-white/80" />
            <h3 className="mt-4 max-w-sm font-display text-2xl font-black leading-tight">{t('home.plusTitle')}</h3>
            <p className="mt-3 max-w-sm text-white/80">{t('home.plusSub')}</p>
            <Link href="/pricing" className="btn btn-gold mt-6">
              {t('home.plusCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="h-full">
          <div className="h-full rounded-4xl border border-line bg-white p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-xezer-50">
                <Emoji name="shield" size={34} />
              </span>
              <h3 className="font-display text-xl font-bold">{t('home.safetyTitle')}</h3>
            </div>
            <ul className="mt-5 space-y-3">
              {[t('home.safety1'), t('home.safety2'), t('home.safety3'), t('home.safety4')].map((s) => (
                <li key={s} className="flex gap-3 text-sm text-ink-soft">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-xezer-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <Link href="/safety" className="btn btn-ghost btn-sm mt-4 -ml-3">
              {t('home.safetyMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---------------- EKO + MOBİL ---------------- */}
      <section className="container grid gap-4 pt-4 md:grid-cols-2">
        <Reveal>
          <div className="flex h-full items-center gap-5 rounded-4xl bg-xezer-50 p-6 ring-1 ring-xezer-100">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white">
              <Leaf className="h-8 w-8 text-xezer-500" />
            </span>
            <div>
              <h3 className="font-bold">{t('home.ecoTitle')}</h3>
              <p className="mt-1 text-sm text-ink-soft">{t('home.ecoSub')}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="flex h-full items-center gap-5 rounded-4xl bg-nar-50 p-6 ring-1 ring-nar-100">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white">
              <Smartphone className="h-8 w-8 text-nar-500" />
            </span>
            <div>
              <h3 className="font-bold">{t('home.appTitle')}</h3>
              <p className="mt-1 text-sm text-ink-soft">{t('home.appSub')}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- SON CTA ---------------- */}
      <section className="container pt-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl border-2 border-ink bg-nar-500 px-6 py-14 text-center text-white shadow-pop sm:py-16">
            <div className="bg-dots absolute inset-0 opacity-30" />
            <Emoji name="party_popper" size={84} className="relative mx-auto animate-float" />
            <h2 className="relative mt-4 font-display text-3xl font-black sm:text-5xl">{t('home.finalTitle')}</h2>
            <p className="relative mx-auto mt-3 max-w-md text-white/85">{t('home.finalSub')}</p>
            <Link href="/listings/new" className="btn btn-gold btn-lg relative mt-8">
              <Plus className="h-5 w-5" strokeWidth={3} />
              {t('home.ctaPost')}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
