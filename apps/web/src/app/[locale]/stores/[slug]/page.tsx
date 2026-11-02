import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BadgeCheck, Clock, Globe, AtSign, MapPin, Package, Phone, Repeat2, Star, Store as StoreIcon } from 'lucide-react';
import { serverApi } from '@/lib/server-api';
import { formatDate, timeAgo } from '@/lib/format';
import type { ListingCard, PublicUser, Store } from '@/lib/types';
import { ListingGrid } from '@/components/ListingCard';
import { Avatar, EmptyState, Stars } from '@/components/ui';
import { StoreOwnerActions } from '@/components/StoreOwnerActions';

export const dynamic = 'force-dynamic';

interface Data {
  store: Store;
  owner: PublicUser;
  listings: ListingCard[];
  reviews: { id: string; rating: number; comment: string; createdAt: string; author: { id: string; name: string; avatarUrl: string | null } }[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await serverApi<Data>(`/stores/${slug}`);
  if (!d) return {};
  return {
    title: d.store.name,
    description: d.store.tagline || d.store.description.slice(0, 160),
    openGraph: { title: d.store.name, description: d.store.tagline, images: d.store.logoUrl ? [{ url: d.store.logoUrl }] : [] },
  };
}

/** Açıq fonda qara, tünd fonda ağ mətn */
function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0B0B0F' : '#FFFFFF';
}

export default async function StorePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const d = await serverApi<Data>(`/stores/${slug}`);
  if (!d) notFound();
  const t = await getTranslations();
  const s = d.store;
  const o = d.owner;
  const fg = textOn(s.coverColor);

  const contacts = [
    s.address && { icon: MapPin, v: `${t(`cities.${s.city}`)}, ${s.address}` },
    !s.address && { icon: MapPin, v: t(`cities.${s.city}`) },
    s.hours && { icon: Clock, v: s.hours },
    s.phone && { icon: Phone, v: s.phone, href: `tel:${s.phone.replace(/[^+\d]/g, '')}` },
    s.instagram && { icon: AtSign, v: `@${s.instagram}`, href: `https://instagram.com/${s.instagram}` },
    s.website && { icon: Globe, v: s.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: s.website },
  ].filter(Boolean) as { icon: typeof MapPin; v: string; href?: string }[];

  const stats = [
    { icon: Package, v: d.listings.length, l: t('profile.listings'), c: 'bg-nar-500 text-white' },
    { icon: Repeat2, v: o.completedTrades, l: t('profile.trades'), c: 'bg-xezer-400 text-ink' },
    { icon: Star, v: o.rating ?? '—', l: `${t('profile.rating')} (${o.ratingCount})`, c: 'bg-zefran-400 text-ink' },
  ];

  return (
    <div className="container py-6 md:py-10">
      <div className="overflow-hidden rounded-4xl border-[2.5px] border-ink bg-white shadow-card">
        <div className="relative h-32 border-b-[2.5px] border-ink bg-dots sm:h-44" style={{ backgroundColor: s.coverColor, color: fg }}>
          <span className="badge absolute left-5 top-5 bg-lale-500 text-white sm:left-6">
            <StoreIcon className="h-3 w-3" strokeWidth={3} />
            {t('stores.tag')}
          </span>
          {s.tagline && (
            <p className="absolute bottom-4 right-5 hidden max-w-md rotate-[-2deg] rounded-xl border-[2.5px] border-ink bg-white px-4 py-2 text-right font-display text-lg font-extrabold text-ink shadow-sm md:block">
              “{s.tagline}”
            </p>
          )}
        </div>
        <div className="px-5 pb-6 sm:px-6">
          <div className="relative z-10 -mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Avatar name={s.name} url={s.logoUrl} size={104} square className="border-[3px] shadow-card" />
              <div className="min-w-0 pb-1">
                <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-black sm:text-3xl">
                  {s.name}
                  {s.verified && (
                    <span className="badge bg-lale-500 text-white">
                      <BadgeCheck className="h-3.5 w-3.5" strokeWidth={3} />
                      {t('stores.verified')}
                    </span>
                  )}
                </h1>
                {s.tagline && <p className="mt-1 text-ink-soft md:hidden">{s.tagline}</p>}
                <p className="mt-1 text-sm text-ink-mute">{t('stores.since', { date: formatDate(s.createdAt) })}</p>
              </div>
            </div>
            <StoreOwnerActions ownerId={o.id} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((x, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-white p-3 sm:p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${x.c}`}>
                  <x.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <dd className="font-mono text-xl font-extrabold">{x.v}</dd>
                  <dt className="truncate text-xs font-semibold text-ink-mute">{x.l}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          <h2 className="section-title mb-5">{t('stores.listings')}</h2>
          {d.listings.length ? <ListingGrid items={d.listings} className="lg:grid-cols-3" /> : <EmptyState emoji="shopping_bags" title={t('stores.noListings')} />}
        </section>

        <aside className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="border-b-[2.5px] border-ink bg-zefran-300 px-5 py-3 font-display text-lg font-extrabold">{t('stores.contact')}</h2>
            <ul className="divide-y-2 divide-ink/10">
              {contacts.map((c, i) => {
                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-cream">
                      <c.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 break-words text-sm font-semibold">{c.v}</span>
                  </>
                );
                return (
                  <li key={i}>
                    {c.href ? (
                      <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 transition hover:bg-cream">
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {s.description && (
            <section className="card p-5">
              <h2 className="font-display text-lg font-extrabold">{t('stores.about')}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{s.description}</p>
            </section>
          )}

          <section>
            <h2 className="section-title mb-4 text-xl sm:text-2xl">{t('stores.reviews')}</h2>
            {d.reviews.length === 0 ? (
              <p className="rounded-3xl border-[2.5px] border-dashed border-ink bg-white p-6 text-center text-ink-mute">{t('stores.noReviews')}</p>
            ) : (
              <ul className="space-y-3">
                {d.reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.author.name} url={r.author.avatarUrl} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{r.author.name}</div>
                        <Stars value={r.rating} size={12} />
                      </div>
                      <span className="text-[11px] text-ink-mute">{timeAgo(r.createdAt, locale)}</span>
                    </div>
                    {r.comment && <p className="mt-3 text-sm text-ink-soft">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
