'use client';

import { useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { formatDate, formatQepik } from '@/lib/format';
import { useErrorText } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { EmptyState, Skeleton } from '@/components/ui';
import { Select } from '@/components/Select';
import type { ListingCard, Me } from '@/lib/types';

type Tab = 'stats' | 'reports' | 'listings' | 'users' | 'ads';

interface Stats { users: number; usersWeek: number; listings: number; listingsDay: number; offers: number; completed: number; openReports: number; revenue: number; plus: number }
interface Report { id: string; reason: string; details: string; createdAt: string; reporter: { id: string; name: string }; listing: { id: string; title: string; status: string } | null; user: { id: string; name: string } | null }
interface Ad { id: string; placement: string; title: string; imageUrl: string; linkUrl: string; advertiser: string; active: boolean; impressions: number; clicks: number }

export default function AdminPage() {
  const t = useTranslations('admin');
  const tt = useTranslations();
  const locale = useLocale();
  const { me } = useRequireAuth();
  const toast = useToast();
  const errText = useErrorText();
  const [tab, setTab] = useState<Tab>('stats');
  const [q, setQ] = useState('');
  const staff = me && me.role !== 'USER';
  const stats = useSWR<Stats>(staff && tab === 'stats' ? '/admin/stats' : null);
  const reports = useSWR<{ items: Report[] }>(staff && tab === 'reports' ? '/admin/reports' : null);
  const listings = useSWR<{ items: ListingCard[] }>(staff && tab === 'listings' ? `/admin/listings?q=${encodeURIComponent(q)}` : null);
  const users = useSWR<{ items: (Me & { isBanned: boolean })[] }>(staff && tab === 'users' ? `/admin/users?q=${encodeURIComponent(q)}` : null);
  const ads = useSWR<{ items: Ad[] }>(staff && tab === 'ads' ? '/admin/ads' : null);
  const [ad, setAd] = useState({ placement: 'home_top', title: '', imageUrl: '', linkUrl: '', advertiser: '' });

  const call = async (fn: () => Promise<unknown>, after: () => void) => {
    try {
      await fn();
      toast(tt('common.saved'));
      after();
    } catch (e) {
      toast(errText(e), 'error');
    }
  };

  if (!me) return null;
  if (!staff) return <div className="container py-16"><EmptyState emoji="locked" title={tt('errors.forbidden')} /></div>;

  return (
    <div className="container py-6 md:py-10">
      <h1 className="font-display text-3xl font-black">{t('title')}</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['stats', 'reports', 'listings', 'users', 'ads'] as Tab[]).map((k) => (
          <button key={k} onClick={() => { setTab(k); setQ(''); }} className={clsx('chip shrink-0', tab === k && 'chip-active')}>
            {t(k)}
          </button>
        ))}
      </div>

      {(tab === 'listings' || tab === 'users') && (
        <input className="input mt-4 max-w-sm" placeholder={tt('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      )}

      <div className="mt-6">
        {tab === 'stats' &&
          (stats.data ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {[
                [t('users'), stats.data.users],
                [t('usersWeek'), stats.data.usersWeek],
                [t('listings'), stats.data.listings],
                [t('listingsDay'), stats.data.listingsDay],
                [t('offers'), stats.data.offers],
                [t('completed'), stats.data.completed],
                [t('openReports'), stats.data.openReports],
                [t('plus'), stats.data.plus],
                [t('revenue'), formatQepik(stats.data.revenue, locale)],
              ].map(([k, v]) => (
                <div key={String(k)} className="card p-5">
                  <div className="text-xs font-semibold text-ink-mute">{k}</div>
                  <div className="mt-1 font-display text-2xl font-black">{v}</div>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-40 rounded-3xl" />
          ))}

        {tab === 'reports' &&
          (reports.data?.items.length === 0 ? (
            <EmptyState emoji="shield" title={t('noReports')} />
          ) : (
            <div className="space-y-3">
              {reports.data?.items.map((r) => (
                <div key={r.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{tt(`listing.reasons.${r.reason}`)}</div>
                    {r.listing && <Link href={`/listings/${r.listing.id}`} className="text-sm font-semibold text-nar-600 underline">{r.listing.title}</Link>}
                    {r.details && <p className="text-sm text-ink-soft">{r.details}</p>}
                    <div className="text-xs text-ink-mute">{r.reporter.name} · {formatDate(r.createdAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    {r.listing && (
                      <button className="btn btn-primary btn-sm" onClick={() => call(() => api(`/admin/listings/${r.listing!.id}/moderate`, { method: 'POST', body: { action: 'reject', reason: r.reason } }).then(() => api(`/admin/reports/${r.id}`, { method: 'POST', body: { status: 'RESOLVED' } })), () => reports.mutate())}>
                        {t('rejectListing')}
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => call(() => api(`/admin/reports/${r.id}`, { method: 'POST', body: { status: 'DISMISSED' } }), () => reports.mutate())}>
                      {t('dismiss')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === 'listings' && (
          <div className="card divide-y divide-line">
            {listings.data?.items.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3">
                <img src={l.image?.thumbUrl} alt="" className="h-12 w-12 rounded-xl bg-cream object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.id}`} className="block truncate font-bold hover:underline">{l.title}</Link>
                  <div className="text-xs text-ink-mute">{l.owner.name} · {tt(`lstatus.${l.status}`)}</div>
                </div>
                {l.status === 'REJECTED' ? (
                  <button className="btn btn-teal btn-sm" onClick={() => call(() => api(`/admin/listings/${l.id}/moderate`, { method: 'POST', body: { action: 'approve' } }), () => listings.mutate())}>{t('approve')}</button>
                ) : (
                  <button className="btn btn-outline btn-sm" onClick={() => call(() => api(`/admin/listings/${l.id}/moderate`, { method: 'POST', body: { action: 'reject' } }), () => listings.mutate())}>{t('rejectListing')}</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="card divide-y divide-line">
            {users.data?.items.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/users/${u.id}`} className="font-bold hover:underline">{u.name}</Link>
                  <div className="text-xs text-ink-mute">{u.email} · {u.role} · {formatQepik(u.balance, locale)} · {u.completedTrades} takas</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => call(() => api(`/admin/users/${u.id}`, { method: 'POST', body: { addBoosts: 1 } }), () => users.mutate())}>+1 ✨</button>
                <button className={clsx('btn btn-sm', u.isBanned ? 'btn-teal' : 'btn-primary')} onClick={() => call(() => api(`/admin/users/${u.id}`, { method: 'POST', body: { isBanned: !u.isBanned } }), () => users.mutate())}>
                  {u.isBanned ? t('unban') : t('ban')}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'ads' && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="card space-y-3 p-5">
              <h2 className="font-display font-bold">{t('addAd')}</h2>
              <Select value={ad.placement} onChange={(e) => setAd({ ...ad, placement: e.target.value })}>
                {['home_top', 'home_middle', 'search_inline', 'listing_sidebar'].map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
              <input className="input" placeholder={t('adTitle')} value={ad.title} onChange={(e) => setAd({ ...ad, title: e.target.value })} />
              <input className="input" placeholder={t('imageUrl')} value={ad.imageUrl} onChange={(e) => setAd({ ...ad, imageUrl: e.target.value })} />
              <input className="input" placeholder={t('linkUrl')} value={ad.linkUrl} onChange={(e) => setAd({ ...ad, linkUrl: e.target.value })} />
              <input className="input" placeholder={t('advertiser')} value={ad.advertiser} onChange={(e) => setAd({ ...ad, advertiser: e.target.value })} />
              <button className="btn btn-primary w-full" onClick={() => call(() => api('/admin/ads', { method: 'POST', body: ad }), () => { ads.mutate(); setAd({ ...ad, title: '', imageUrl: '', linkUrl: '' }); })}>
                {t('addAd')}
              </button>
            </div>
            <div className="space-y-3">
              {ads.data?.items.map((a) => (
                <div key={a.id} className="card flex items-center gap-3 p-3">
                  <img src={a.imageUrl} alt="" className="h-14 w-24 rounded-xl bg-cream object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{a.title}</div>
                    <div className="text-xs text-ink-mute">{a.placement} · {t('impressions')}: {a.impressions} · {t('clicks')}: {a.clicks}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => call(() => api(`/admin/ads/${a.id}`, { method: 'PATCH', body: { active: !a.active } }), () => ads.mutate())}>
                    {a.active ? '⏸' : '▶'}
                  </button>
                  <button className="btn btn-ghost btn-sm text-nar-600" onClick={() => call(() => api(`/admin/ads/${a.id}`, { method: 'DELETE' }), () => ads.mutate())}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
