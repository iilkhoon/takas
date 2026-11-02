'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Archive, Flag, MessageCircle, Pencil, Repeat2, Rocket, Share2, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import type { ListingDetail } from '@/lib/types';
import { useAuth, useErrorText } from '../Providers';
import { useToast } from '../Toast';
import { FavoriteButton } from '../ListingCard';
import { OfferComposer } from '../OfferComposer';
import { Modal, Spinner } from '../ui';
import { Select } from '../Select';

export function ListingActions({ listing }: { listing: ListingDetail }) {
  const t = useTranslations('listing');
  const tc = useTranslations('common');
  const { me, refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const errText = useErrorText();
  const { mutate } = useSWRConfig();
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');

  const isOwner = me?.id === listing.owner.id;
  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast(ok);
      await refresh();
      router.refresh();
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: t('shareText'), url });
        return;
      } catch {
        /* istifadəçi ləğv etdi */
      }
    }
    await navigator.clipboard.writeText(url);
    toast(t('linkCopied'));
  };

  const askQuestion = async () => {
    if (!me) return router.push(`/login?next=/listings/${listing.id}`);
    const r = await api<{ id: string }>('/conversations', { method: 'POST', body: { listingId: listing.id } });
    router.push(`/messages/${r.id}`);
  };

  if (isOwner) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl bg-cream p-4 text-sm font-semibold text-ink-soft">{t('yourListing')}</div>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/listings/${listing.id}/edit`} className="btn btn-outline">
            <Pencil className="h-4 w-4" />
            {tc('edit')}
          </Link>
          {listing.status === 'ACTIVE' ? (
            <button className="btn btn-outline" disabled={!!busy} onClick={() => run('archive', () => api(`/listings/${listing.id}/status`, { method: 'POST', body: { status: 'ARCHIVED' } }))}>
              <Archive className="h-4 w-4" />
              {t('archive')}
            </button>
          ) : listing.status === 'ARCHIVED' ? (
            <button className="btn btn-outline" disabled={!!busy} onClick={() => run('activate', () => api(`/listings/${listing.id}/status`, { method: 'POST', body: { status: 'ACTIVE' } }))}>
              <RotateCcw className="h-4 w-4" />
              {t('activate')}
            </button>
          ) : (
            <span />
          )}
        </div>
        {listing.status === 'ACTIVE' && (
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-teal" disabled={!!busy} onClick={() => run('bump', () => api(`/listings/${listing.id}/bump`, { method: 'POST' }), t('bumpOk'))}>
              {busy === 'bump' ? <Spinner /> : <Rocket className="h-4 w-4" />}
              {t('bump')}
            </button>
            <button className="btn btn-gold" disabled={!!busy} onClick={() => run('vip', () => api(`/listings/${listing.id}/vip`, { method: 'POST' }), t('vipOk'))}>
              {busy === 'vip' ? <Spinner /> : <Sparkles className="h-4 w-4" />}
              {t('makeVip')}
            </button>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm w-full text-nar-600"
          disabled={!!busy}
          onClick={() => {
            if (!confirm(t('deleteConfirm'))) return;
            run('delete', async () => {
              await api(`/listings/${listing.id}`, { method: 'DELETE' });
              router.push('/my-listings');
            });
          }}
        >
          <Trash2 className="h-4 w-4" />
          {tc('delete')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listing.status === 'ACTIVE' ? (
        listing.myPendingOffer ? (
          <Link href="/offers" className="btn btn-dark btn-lg w-full">
            <Repeat2 className="h-5 w-5" />
            {t('offerSent')} · {t('viewOffer')}
          </Link>
        ) : (
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={() => (me ? setOfferOpen(true) : router.push(`/login?next=/listings/${listing.id}`))}
          >
            <Repeat2 className="h-5 w-5" />
            {me ? t('makeOffer') : t('loginToOffer')}
          </button>
        )
      ) : (
        <div className="rounded-3xl bg-ink px-4 py-3 text-center text-sm font-bold text-white">{listing.status === 'TRADED' ? t('traded') : t('reserved')}</div>
      )}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <button className="btn btn-outline" onClick={askQuestion}>
          <MessageCircle className="h-4 w-4" />
          {t('askQuestion')}
        </button>
        <FavoriteButton id={listing.id} initial={listing.isFavorite} className="h-[50px] w-[50px] rounded-2xl border-2 border-ink/10 shadow-none" />
        <button onClick={share} className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl border-2 border-ink/10 bg-white transition hover:border-ink/20" aria-label={tc('share')}>
          <Share2 className="h-5 w-5" />
        </button>
      </div>
      <button onClick={() => (me ? setReportOpen(true) : router.push('/login'))} className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-ink-mute transition hover:text-nar-600">
        <Flag className="h-3.5 w-3.5" />
        {tc('report')}
      </button>

      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title={t('makeOffer')} size="lg">
        <OfferComposer
          target={{
            id: listing.id,
            title: listing.title,
            estimatedValue: listing.estimatedValue,
            acceptsCash: listing.acceptsCash,
            swapType: listing.swapType,
            extraCash: listing.extraCash,
            image: listing.images[0] ?? null,
            icon: listing.category.icon,
          }}
          onDone={async (r) => {
            setOfferOpen(false);
            await mutate('/auth/me');
            router.refresh();
            if (r.conversationId) router.push(`/messages/${r.conversationId}`);
          }}
        />
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('reportTitle')} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">{t('reportReason')}</label>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {['scam', 'prohibited', 'wrong_category', 'duplicate', 'offensive', 'other'].map((r) => (
                <option key={r} value={r}>
                  {t(`reasons.${r}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="label">{t('reportDetails')}</label>
            <textarea className="input resize-none" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
          </div>
          <button
            className="btn btn-primary w-full"
            disabled={busy === 'report'}
            onClick={() =>
              run(
                'report',
                async () => {
                  await api('/reports', { method: 'POST', body: { listingId: listing.id, reason, details } });
                  setReportOpen(false);
                },
                t('reportSent'),
              )
            }
          >
            {tc('send')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
