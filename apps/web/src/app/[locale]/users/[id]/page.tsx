import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Calendar, MapPin, Repeat2, Star, Package } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { serverApi } from '@/lib/server-api';
import { formatDate, timeAgo } from '@/lib/format';
import type { ListingCard, PublicUser } from '@/lib/types';
import { ListingGrid } from '@/components/ListingCard';
import { Avatar, EmptyState, LevelBadge, Stars, TrustBadges } from '@/components/ui';
import { ProfileActions } from '@/components/ProfileActions';

export const dynamic = 'force-dynamic';

interface Data {
  user: PublicUser;
  listings: ListingCard[];
  reviews: { id: string; rating: number; comment: string; createdAt: string; author: { id: string; name: string; avatarUrl: string | null } }[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await serverApi<Data>(`/users/${id}`);
  return d ? { title: d.user.name } : {};
}

export default async function UserPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const d = await serverApi<Data>(`/users/${id}`);
  if (!d) notFound();
  const t = await getTranslations();
  const u = d.user;

  return (
    <div className="container py-6 md:py-10">
      <div className="relative overflow-hidden rounded-4xl bg-white border-[2.5px] border-ink">
        <div className="h-28 border-b-[2.5px] border-ink bg-zefran-400 bg-dots sm:h-36" />
        <div className="px-6 pb-6">
          <div className="relative z-10 -mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Avatar name={u.name} url={u.avatarUrl} size={104} className="border-[3px] shadow-card" />
              <div className="pb-1">
                <h1 className="flex items-center gap-2 font-display text-2xl font-black">
                  {u.name}
                  <TrustBadges verified={u.phoneVerified} plus={u.plan === 'PLUS'} size={20} />
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-mute">
                  <LevelBadge level={u.level} />
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{t(`cities.${u.city}`)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{t('common.member', { date: formatDate(u.createdAt) })}</span>
                </div>
              </div>
            </div>
            <ProfileActions userId={u.id} />
          </div>
          {u.store && (
            <Link
              href={`/stores/${u.store.slug}`}
              className="mt-5 flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-lale-500 p-3 pr-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:inline-flex"
            >
              <Avatar name={u.store.name} url={u.store.logoUrl} size={40} square />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10.5px] font-bold uppercase tracking-wider text-white/80">{t('stores.tag')}</span>
                <span className="block truncate font-display font-extrabold">{u.store.name}</span>
              </span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          {u.bio && <p className="mt-5 max-w-2xl text-ink-soft">{u.bio}</p>}
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Repeat2, v: u.completedTrades, l: t('profile.trades'), c: 'bg-xezer-400 text-ink' },
              { icon: Star, v: u.rating ?? '—', l: `${t('profile.rating')} (${u.ratingCount})`, c: 'bg-zefran-400 text-ink' },
              { icon: Package, v: d.listings.length, l: t('profile.listings'), c: 'bg-nar-500 text-white' },
              { icon: Repeat2, v: u.tradedItems ?? 0, l: t('profile.traded'), c: 'bg-lale-500 text-white' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-white p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${s.c}`}><s.icon className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <dd className="font-mono text-xl font-extrabold">{s.v}</dd>
                  <dt className="truncate text-xs font-semibold text-ink-mute">{s.l}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="section-title mb-5">{t('profile.listings')}</h2>
          {d.listings.length ? <ListingGrid items={d.listings} className="lg:grid-cols-3" /> : <EmptyState emoji="package" title={t('profile.noListings')} />}
        </section>
        <section>
          <h2 className="section-title mb-5">{t('profile.reviews')}</h2>
          {d.reviews.length === 0 ? (
            <p className="rounded-3xl bg-white p-6 text-center text-ink-mute border-[2.5px] border-ink">{t('profile.noReviews')}</p>
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
      </div>
    </div>
  );
}
