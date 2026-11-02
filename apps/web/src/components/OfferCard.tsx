'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Check, CheckCircle2, MessageCircle, Repeat2, Star, X, Undo2, Banknote } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatAzn, timeAgo } from '@/lib/format';
import type { ListingCard, Offer, OfferStatus } from '@/lib/types';
import { useAuth, useErrorText } from './Providers';
import { useToast } from './Toast';
import { OfferComposer } from './OfferComposer';
import { Avatar, Emoji, Modal, Spinner } from './ui';

const statusStyle: Record<OfferStatus, string> = {
  PENDING: 'bg-zefran-100 text-zefran-800',
  ACCEPTED: 'bg-xezer-100 text-xezer-800',
  COMPLETED: 'bg-xezer-500 text-white',
  REJECTED: 'bg-nar-100 text-nar-700',
  CANCELLED: 'bg-ink/5 text-ink-mute',
  COUNTERED: 'bg-lale-100 text-lale-700',
};

function Thumb({ l, size = 64 }: { l: ListingCard; size?: number }) {
  return (
    <Link href={`/listings/${l.id}`} className="group block shrink-0" title={l.title}>
      <div className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-cream" style={{ width: size, height: size }}>
        {l.image ? <img src={l.image.thumbUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Emoji name={l.category.icon} size={size} />}
      </div>
    </Link>
  );
}

function Steps({ status, both }: { status: OfferStatus; both: boolean }) {
  const t = useTranslations('offer.steps');
  const idx = status === 'COMPLETED' ? 4 : status === 'ACCEPTED' ? (both ? 3 : 2) : status === 'PENDING' ? 1 : 0;
  const steps = [t('sent'), t('accepted'), t('met'), t('done')];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col gap-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <motion.div className="h-full rounded-full bg-xezer-500" initial={{ width: 0 }} animate={{ width: i < idx ? '100%' : '0%' }} transition={{ delay: i * 0.12, duration: 0.4 }} />
          </div>
          <span className={clsx('text-[10px] font-bold', i < idx ? 'text-xezer-700' : 'text-ink-mute')}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button key={i} type="button" whileTap={{ scale: 0.8 }} whileHover={{ scale: 1.15 }} onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} aria-label={`${i}`}>
          <Star className={clsx('h-10 w-10 transition', i <= (hover || value) ? 'fill-zefran-400 text-zefran-400' : 'fill-ink/5 text-ink/15')} />
        </motion.button>
      ))}
    </div>
  );
}

export function OfferCard({ offer, onChange }: { offer: Offer; onChange: () => void }) {
  const t = useTranslations('offer');
  const tt = useTranslations();
  const locale = useLocale();
  const { me, refresh } = useAuth();
  const toast = useToast();
  const errText = useErrorText();
  const [busy, setBusy] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const isSender = offer.role === 'sender';
  const other = isSender ? offer.toUser : offer.fromUser;
  const act = async (key: string, path: string, ok: string, body?: unknown) => {
    setBusy(key);
    try {
      await api(`/offers/${offer.id}/${path}`, { method: 'POST', body });
      toast(ok);
      onChange();
      refresh();
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const cash = offer.cashAmount;
  const both = offer.fromConfirmed && offer.toConfirmed;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className={clsx('flex flex-wrap items-center justify-between gap-2 border-b-[2.5px] border-ink px-5 py-3', offer.myTurn ? 'bg-zefran-300' : 'bg-cream')}>
        <Link href={`/users/${other.id}`} className="flex min-w-0 items-center gap-2.5">
          <Avatar name={other.name} url={other.avatarUrl} size={32} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{other.name}</div>
            <div className="text-[11px] text-ink-mute">{timeAgo(offer.updatedAt, locale)}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {offer.myTurn && <span className="badge animate-pulse bg-nar-500 text-white">{t('myTurn')}</span>}
          <span className={clsx('badge', statusStyle[offer.status])}>{tt(`ostatus.${offer.status}`)}</span>
        </div>
      </div>

      <div className="grid items-center gap-4 p-5 sm:grid-cols-[1fr_auto_1fr]">
        {/* Təklif olunan */}
        <div className="min-w-0">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">{isSender ? t('youGive') : t('theyGive')}</div>
          <div className="flex flex-wrap items-center gap-2">
            {offer.items.map((it) => (
              <Thumb key={it.id} l={it} />
            ))}
            {cash !== 0 && (
              <span className={clsx('flex h-16 items-center gap-1 rounded-2xl px-3 text-sm font-bold', cash > 0 ? 'bg-xezer-100 text-xezer-700' : 'bg-nar-100 text-nar-700')}>
                <Banknote className="h-4 w-4" />
                {cash > 0 ? t('plusCash', { amount: formatAzn(cash, locale) }) : t('minusCash', { amount: formatAzn(-cash, locale) })}
              </span>
            )}
          </div>
          {offer.items.length > 0 && <div className="mt-1.5 truncate text-xs text-ink-soft">{offer.items.map((i) => i.title).join(', ')}</div>}
        </div>

        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
            <ArrowLeftRight className="h-5 w-5" />
          </span>
        </div>

        <div className="min-w-0 sm:text-right">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">{isSender ? t('youGet') : t('youGive')}</div>
          <div className="flex items-center gap-2 sm:flex-row-reverse">
            <Thumb l={offer.listing} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{offer.listing.title}</div>
              <div className="text-xs font-bold text-nar-600">≈ {formatAzn(offer.listing.estimatedValue, locale)}</div>
            </div>
          </div>
        </div>
      </div>

      {offer.message && <div className="mx-5 mb-4 rounded-2xl bg-cream px-4 py-3 text-sm italic text-ink-soft">“{offer.message}”</div>}

      {(offer.status === 'PENDING' || offer.status === 'ACCEPTED' || offer.status === 'COMPLETED') && (
        <div className="px-5 pb-4">
          <Steps status={offer.status} both={both} />
        </div>
      )}

      {offer.status === 'ACCEPTED' && <p className="mx-5 mb-4 rounded-2xl bg-xezer-100 px-4 py-3 text-sm text-xezer-800">{t('nextSteps')}</p>}

      <div className="flex flex-wrap gap-2 border-t border-line bg-cream/40 px-5 py-3">
        {offer.status === 'PENDING' && offer.myTurn && (
          <>
            <button className="btn btn-teal btn-sm" disabled={!!busy} onClick={() => act('accept', 'accept', t('accepted'))}>
              {busy === 'accept' ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
              {t('accept')}
            </button>
            <button className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => setCounterOpen(true)}>
              <Repeat2 className="h-4 w-4" />
              {t('counter')}
            </button>
            <button className="btn btn-ghost btn-sm text-nar-600" disabled={!!busy} onClick={() => act('reject', 'reject', t('rejected'))}>
              <X className="h-4 w-4" />
              {t('reject')}
            </button>
          </>
        )}
        {offer.status === 'PENDING' && !offer.myTurn && offer.proposerId === me?.id && (
          <>
            <span className="flex items-center text-sm font-semibold text-ink-mute">{t('theirTurn')}…</span>
            <button className="btn btn-ghost btn-sm ml-auto" disabled={!!busy} onClick={() => act('cancel', 'cancel', t('cancelled'))}>
              <Undo2 className="h-4 w-4" />
              {t('cancel')}
            </button>
          </>
        )}
        {offer.status === 'ACCEPTED' && (
          <>
            {offer.myConfirmed ? (
              <span className="flex items-center gap-1.5 text-sm font-bold text-xezer-700">
                <CheckCircle2 className="h-4 w-4" />
                {t('youConfirmed')} · {t('waitingOther')}
              </span>
            ) : (
              <button className="btn btn-teal btn-sm" disabled={!!busy} onClick={() => act('complete', 'complete', t('confirmedOne'))}>
                {busy === 'complete' ? <Spinner className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {t('complete')}
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm text-nar-600"
              disabled={!!busy}
              onClick={() => confirm(t('cancelDeal') + '?') && act('cancel', 'cancel', t('cancelled'))}
            >
              {t('cancelDeal')}
            </button>
          </>
        )}
        {offer.status === 'COMPLETED' &&
          (offer.reviewed ? (
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink-mute">
              <Star className="h-4 w-4 fill-zefran-400 text-zefran-400" />
              {t('reviewed')}
            </span>
          ) : (
            <button className="btn btn-gold btn-sm" onClick={() => setReviewOpen(true)}>
              <Star className="h-4 w-4" />
              {t('leaveReview')}
            </button>
          ))}
        {offer.conversationId && (
          <Link href={`/messages/${offer.conversationId}`} className="btn btn-ghost btn-sm ml-auto">
            <MessageCircle className="h-4 w-4" />
            {t('openChat')}
          </Link>
        )}
      </div>

      <Modal open={counterOpen} onClose={() => setCounterOpen(false)} title={t('counterTitle')} size="lg">
        <p className="mb-4 text-sm text-ink-soft">{t('counterHint')}</p>
        <OfferComposer
          mode="counter"
          offerId={offer.id}
          fromUserId={offer.fromUser.id}
          isOfferer={isSender}
          initialItems={offer.items.map((i) => i.id)}
          initialCash={offer.cashAmount}
          target={{
            id: offer.listing.id,
            title: offer.listing.title,
            estimatedValue: offer.listing.estimatedValue,
            acceptsCash: offer.listing.acceptsCash,
            swapType: offer.listing.swapType,
            extraCash: offer.listing.extraCash,
            image: offer.listing.image,
            icon: offer.listing.category.icon,
          }}
          onDone={() => {
            setCounterOpen(false);
            onChange();
          }}
        />
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={t('reviewTitle')} size="sm">
        <div className="space-y-5 text-center">
          <Avatar name={other.name} url={other.avatarUrl} size={64} className="mx-auto" />
          <div className="font-bold">{other.name}</div>
          <StarPicker value={rating} onChange={setRating} />
          <textarea className="input resize-none text-left" rows={3} placeholder={t('reviewPh')} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
          <button
            className="btn btn-primary w-full"
            disabled={!!busy}
            onClick={async () => {
              await act('review', 'review', t('reviewThanks'), { rating, comment });
              setReviewOpen(false);
            }}
          >
            {tt('common.send')}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
