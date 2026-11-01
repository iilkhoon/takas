import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Banknote, Eye, Heart, MapPin, Repeat2, ShieldCheck, Sparkles, Truck, Clock, Tag, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { serverApi } from '@/lib/server-api';
import { formatAzn, formatDate, timeAgo } from '@/lib/format';
import type { ListingCard, ListingDetail, Locale } from '@/lib/types';
import { Gallery } from '@/components/listing/Gallery';
import { ListingActions } from '@/components/listing/ListingActions';
import { ListingGrid } from '@/components/ListingCard';
import { AdSlot } from '@/components/AdSlot';
import { Avatar, Emoji, LevelBadge, Stars, TrustBadges } from '@/components/ui';

export const dynamic = 'force-dynamic';

type Data = { listing: ListingDetail; similar: ListingCard[] };

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params;
  const data = await serverApi<Data>(`/listings/${id}`);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'listing' });
  const l = data.listing;
  const desc = `${t('wants')}: ${l.wantedText || t('openToAnything')} · ${l.description.slice(0, 140)}`;
  return {
    title: l.title,
    description: desc,
    openGraph: { title: `${l.title} — takas`, description: desc, images: l.images[0] ? [{ url: l.images[0].url }] : [] },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const data = await serverApi<Data>(`/listings/${id}`);
  if (!data) notFound();
  const t = await getTranslations();
  const l = data.listing;
  const loc = locale as Locale;

  return (
    <div className="container py-6 md:py-10">
      {/* Yol göstəricisi */}
      <nav className="mb-5 flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-ink-mute scrollbar-none">
        <Link href="/" className="hover:text-ink">
          {t('nav.home')}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <Link href={`/listings?category=${l.category.slug}`} className="hover:text-ink">
          {l.category.name[loc] ?? l.category.name.az}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="truncate font-semibold text-ink">{l.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-8">
          <Gallery
            images={l.images}
            title={l.title}
            badges={
              <>
                {l.isVip && (
                  <span className="badge bg-zefran-400 text-ink">
                    <Sparkles className="h-3 w-3" /> VIP
                  </span>
                )}
                {l.status !== 'ACTIVE' && <span className="badge bg-ink text-white">{t(`lstatus.${l.status}`)}</span>}
              </>
            }
          />

          {/* Mobildə başlıq və əməliyyatlar şəkildən sonra */}
          <div className="space-y-5 lg:hidden">
            <Summary l={l} locale={locale} t={t} />
            <ListingActions listing={l} />
          </div>

          <section className="card p-6">
            <h2 className="font-display text-lg font-bold">{t('listing.description')}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{l.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Tag, k: t('listing.condition'), v: t(`cond.${l.condition}`) },
                { icon: MapPin, k: t('listing.city'), v: t(`cities.${l.city}`) },
                { icon: Clock, k: t('listing.posted'), v: formatDate(l.createdAt) },
                { icon: Eye, k: t('listing.views'), v: String(l.views) },
              ].map((d) => (
                <div key={d.k} className="rounded-2xl bg-cream p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
                    <d.icon className="h-3.5 w-3.5" />
                    {d.k}
                  </dt>
                  <dd className="mt-1 font-bold">{d.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-r from-xezer-500 to-xezer-600 px-6 py-4 text-white">
              <Repeat2 className="h-6 w-6" />
              <h2 className="font-display text-lg font-bold">{t('listing.wantedTitle')}</h2>
            </div>
            <div className="p-6">
              {l.wantedText && <p className="text-lg font-bold">{l.wantedText}</p>}
              {l.wantedCategories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {l.wantedCategories.map((c) => (
                    <Link key={c.slug} href={`/listings?category=${c.slug}`} className="chip">
                      <Emoji name={c.icon} size={20} />
                      {c.name[loc] ?? c.name.az}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {l.openToAnything && <span className="badge bg-lale-50 text-lale-700 normal-case tracking-normal">✨ {t('listing.openToAnything')}</span>}
                {l.acceptsCash && (
                  <span className="badge bg-xezer-50 text-xezer-700 normal-case tracking-normal">
                    <Banknote className="h-3.5 w-3.5" />
                    {t('listing.acceptsCash')}
                  </span>
                )}
                {l.canShip && (
                  <span className="badge bg-zefran-50 text-zefran-800 normal-case tracking-normal">
                    <Truck className="h-3.5 w-3.5" />
                    {t('listing.canShip')}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="hidden space-y-5 lg:sticky lg:top-24 lg:block">
            <div className="card space-y-5 p-6">
              <Summary l={l} locale={locale} t={t} />
              <ListingActions listing={l} />
            </div>
            <OwnerCard l={l} t={t} />
            <div className="flex gap-3 rounded-3xl bg-xezer-50 p-4 text-sm text-xezer-800 ring-1 ring-xezer-100">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>
                {t('listing.safetyTip')}{' '}
                <Link href="/safety" className="font-bold underline">
                  {t('home.safetyMore')}
                </Link>
              </span>
            </div>
            <AdSlot placement="listing_sidebar" />
          </div>
          <div className="lg:hidden">
            <OwnerCard l={l} t={t} />
          </div>
        </aside>
      </div>

      {data.similar.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">{t('listing.similar')}</h2>
          <ListingGrid items={data.similar.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function Summary({ l, locale, t }: { l: ListingDetail; locale: string; t: T }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-mute">
        <Emoji name={l.category.icon} size={18} />
        {l.category.name[locale as Locale] ?? l.category.name.az}
        <span>·</span>
        <span>{timeAgo(l.bumpedAt, locale)}</span>
      </div>
      <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-[1.75rem]">{l.title}</h1>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-ink-mute">{t('listing.estimated')}</div>
          <div className="font-display text-3xl font-black text-nar-500">≈ {formatAzn(l.estimatedValue, locale)}</div>
        </div>
        <div className="flex gap-3 text-sm font-semibold text-ink-mute">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {l.favorites}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-4 w-4" />
            {l.offers}
          </span>
        </div>
      </div>
    </div>
  );
}

function OwnerCard({ l, t }: { l: ListingDetail; t: T }) {
  const o = l.owner;
  return (
    <Link href={`/users/${o.id}`} className="card group flex items-center gap-4 p-5 transition hover:shadow-lift">
      <Avatar name={o.name} url={o.avatarUrl} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="truncate">{o.name}</span>
          <TrustBadges verified={o.phoneVerified} plus={o.plan === 'PLUS'} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-mute">
          <LevelBadge level={o.level} />
          {o.rating !== null && (
            <span className="flex items-center gap-1">
              <Stars value={o.rating} size={12} /> {o.rating} ({o.ratingCount})
            </span>
          )}
        </div>
        <div className="mt-1.5 text-xs text-ink-mute">
          {o.completedTrades} {t('profile.trades')} · {o.activeListings} {t('profile.listings').toLowerCase()}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-ink-mute transition group-hover:translate-x-1" />
    </Link>
  );
}
