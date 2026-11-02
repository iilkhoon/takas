'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MapPin, Repeat2, Send, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatAzn, formatTime, timeAgo } from '@/lib/format';
import type { ConversationItem, Message, PublicUser, OfferStatus } from '@/lib/types';
import { useAuth, useErrorText } from './Providers';
import { useToast } from './Toast';
import { Avatar, EmptyState, Emoji, Skeleton, TrustBadges } from './ui';

function ConversationList({ activeId }: { activeId?: string }) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const { me } = useAuth();
  const { data } = useSWR<{ items: ConversationItem[] }>(me ? '/conversations' : null, { refreshInterval: 10000 });
  const sys = useTranslations('chat.system');

  if (!data)
    return (
      <div className="space-y-2 p-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  if (!data.items.length) return <div className="p-4"><EmptyState emoji="speech_balloon" title={t('empty')} sub={t('emptySub')} /></div>;

  return (
    <ul className="divide-y divide-line">
      {data.items.map((c) => {
        const preview = c.lastMessage
          ? c.lastMessage.kind === 'TEXT'
            ? c.lastMessage.body
            : sys.has(c.lastMessage.body)
              ? sys(c.lastMessage.body)
              : c.lastMessage.body
          : '';
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={clsx('flex items-center gap-3 px-4 py-3.5 transition hover:bg-cream', activeId === c.id && 'bg-nar-100 hover:bg-nar-100')}
            >
              <div className="relative">
                <Avatar name={c.other.name} url={c.other.avatarUrl} size={48} />
                {c.listing?.image && (
                  <img src={c.listing.image.thumbUrl} alt="" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg object-cover ring-2 ring-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx('truncate text-sm', c.unread ? 'font-extrabold' : 'font-bold')}>{c.other.name}</span>
                  <span className="shrink-0 text-[11px] text-ink-mute">{timeAgo(c.lastMessageAt, locale)}</span>
                </div>
                {c.listing && <div className="truncate text-[11px] font-semibold text-xezer-700">{c.listing.title}</div>}
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx('truncate text-sm', c.unread ? 'font-semibold text-ink' : 'text-ink-mute')}>{preview}</span>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-nar-500 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

interface ConvData {
  conversation: {
    id: string;
    other: PublicUser;
    listing: { id: string; title: string; status: string; estimatedValue: number; ownerId: string; image: { thumbUrl: string } | null } | null;
  };
  offers: { id: string; status: OfferStatus; proposerId: string; cashAmount: number; createdAt: string }[];
  messages: Message[];
}

const SAFE_PLACES = ['28 Mall', 'Gənclik Mall', 'Park Bulvar', 'Ganjlik metro', '28 May metro', 'Port Baku'];

function Chat({ id }: { id: string }) {
  const t = useTranslations('chat');
  const tt = useTranslations();
  const locale = useLocale();
  const { me, refresh } = useAuth();
  const toast = useToast();
  const errText = useErrorText();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);

  const { data, error } = useSWR<ConvData>(`/conversations/${id}`, { revalidateOnFocus: false });

  useEffect(() => {
    if (data) {
      setMessages(data.messages);
      lastRef.current = data.messages.at(-1)?.createdAt ?? null;
      refresh();
    }
  }, [data, refresh]);

  // Yeni mesajlar üçün sorğu (hər 4 saniyədən bir)
  useEffect(() => {
    if (!data) return;
    const tick = async () => {
      try {
        const after = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : '';
        const r = await api<ConvData>(`/conversations/${id}${after}`);
        if (r.messages.length) {
          setMessages((m) => {
            const ids = new Set(m.map((x) => x.id));
            return [...m, ...r.messages.filter((x) => !ids.has(x.id))];
          });
          lastRef.current = r.messages.at(-1)!.createdAt;
        }
      } catch {
        /* şəbəkə xətası — növbəti dəfə */
      }
    };
    const iv = setInterval(tick, 4000);
    return () => clearInterval(iv);
  }, [data, id]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (body: string) => {
    const b = body.trim();
    if (!b || sending) return;
    setSending(true);
    setText('');
    try {
      const r = await api<{ message: Message }>(`/conversations/${id}/messages`, { method: 'POST', body: { body: b } });
      setMessages((m) => [...m, r.message]);
      lastRef.current = r.message.createdAt;
    } catch (e) {
      setText(b);
      toast(errText(e), 'error');
    } finally {
      setSending(false);
    }
  };

  if (error) return <div className="p-6"><EmptyState emoji="locked" title={tt('errors.not_found')} /></div>;
  if (!data)
    return (
      <div className="flex-1 space-y-3 p-6">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="ml-auto h-14 w-1/2" />
        <Skeleton className="h-14 w-3/5" />
      </div>
    );

  const { other, listing } = data.conversation;
  const activeOffer = data.offers.find((o) => o.status === 'PENDING' || o.status === 'ACCEPTED');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Başlıq */}
      <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
        <Link href="/messages" className="btn-icon -ml-2 md:hidden" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/users/${other.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar name={other.name} url={other.avatarUrl} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate font-bold">
              {other.name}
              <TrustBadges verified={other.phoneVerified} plus={other.plan === 'PLUS'} size={14} />
            </div>
            <div className="text-xs text-ink-mute">
              {Date.now() - new Date(other.lastSeenAt).getTime() < 5 * 60 * 1000 ? (
                <span className="font-semibold text-xezer-600">● {t('online')}</span>
              ) : (
                t('lastSeen', { time: timeAgo(other.lastSeenAt, locale) })
              )}
            </div>
          </div>
        </Link>
        {listing && (
          <Link href={`/listings/${listing.id}`} className="ml-auto flex min-w-0 items-center gap-2 rounded-2xl bg-cream py-1.5 pl-1.5 pr-3 transition hover:bg-cream-deep">
            {listing.image && <img src={listing.image.thumbUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />}
            <div className="hidden min-w-0 sm:block">
              <div className="max-w-[180px] truncate text-xs font-bold">{listing.title}</div>
              <div className="text-[11px] font-bold text-nar-600">≈ {formatAzn(listing.estimatedValue, locale)}</div>
            </div>
          </Link>
        )}
      </div>

      {activeOffer && (
        <Link href="/offers" className="flex items-center gap-2 border-b border-line bg-zefran-100 px-4 py-2.5 text-sm font-semibold text-zefran-900 transition hover:bg-zefran-100">
          <Repeat2 className="h-4 w-4" />
          {tt(`ostatus.${activeOffer.status}`)}
          <span className="ml-auto text-xs font-bold underline">{t('viewOffer')}</span>
        </Link>
      )}

      {/* Mesajlar */}
      <div className="bg-dots min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {messages.map((m, i) => {
          const mine = m.senderId === me?.id;
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          if (m.kind !== 'TEXT') {
            return (
              <div key={m.id} className="flex justify-center py-1">
                <span className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold', m.kind === 'OFFER' ? 'bg-ink text-white' : 'bg-white text-ink-soft border-[2.5px] border-ink')}>
                  {m.kind === 'OFFER' && <Repeat2 className="h-3.5 w-3.5" />}
                  {t.has(`system.${m.body}`) ? t(`system.${m.body}`) : m.body}
                  {m.kind === 'OFFER' && (
                    <Link href="/offers" className="underline">
                      {t('viewOffer')}
                    </Link>
                  )}
                </span>
              </div>
            );
          }
          return (
            <div key={m.id}>
              {newDay && <div className="py-2 text-center text-[11px] font-bold text-ink-mute">{timeAgo(m.createdAt, locale)}</div>}
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug shadow-sm sm:max-w-[65%]',
                    mine ? 'rounded-br-lg bg-nar-500 text-white' : 'rounded-bl-lg bg-white text-ink border-[2.5px] border-ink',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div className={clsx('mt-1 text-right text-[10px]', mine ? 'text-white/70' : 'text-ink-mute')}>
                    {formatTime(m.createdAt)}
                    {mine && m.readAt && ' ✓✓'}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Daxiletmə */}
      <div className="border-t border-line bg-white p-3">
        <AnimatePresence>
          {showPlaces && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-xezer-700">
                <ShieldCheck className="h-4 w-4" />
                {t('safePlaces')}
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SAFE_PLACES.map((p) => (
                  <button key={p} onClick={() => setText((x) => `${x}${x ? ' ' : ''}📍 ${p}`)} className="chip py-1 text-xs">
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {messages.filter((m) => m.kind === 'TEXT').length < 2 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            {[t('quick1'), t('quick2'), t('quick3')].map((q) => (
              <button key={q} onClick={() => send(q)} className="chip shrink-0 py-1 text-xs">
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex items-end gap-2"
        >
          <button type="button" onClick={() => setShowPlaces((s) => !s)} className={clsx('btn-icon h-12 w-12 shrink-0 rounded-2xl', showPlaces && 'bg-xezer-100 text-xezer-600')} aria-label={t('safePlaces')}>
            <MapPin className="h-5 w-5" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={t('placeholder')}
            className="input max-h-32 min-h-12 flex-1 resize-none py-3"
          />
          <button type="submit" disabled={!text.trim() || sending} className="btn btn-primary h-12 w-12 shrink-0 p-0" aria-label={tt('common.send')}>
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Messenger({ activeId }: { activeId?: string }) {
  const t = useTranslations('chat');
  return (
    <div className="container py-0 md:py-8">
      <div className="-mx-4 flex h-[calc(100dvh-190px)] overflow-hidden border-line bg-white sm:mx-0 md:h-[calc(100dvh-72px-64px)] md:rounded-4xl md:border md:shadow-card">
        <aside className={clsx('w-full shrink-0 overflow-y-auto border-r border-line md:block md:w-[340px]', activeId ? 'hidden' : 'block')}>
          <div className="sticky top-0 z-10 border-b border-line bg-white px-4 py-4">
            <h1 className="font-display text-xl font-bold">{t('title')}</h1>
          </div>
          <ConversationList activeId={activeId} />
        </aside>
        <section className={clsx('min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden md:flex')}>
          {activeId ? (
            <Chat key={activeId} id={activeId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-ink-mute">
              <Emoji name="speech_balloon" size={96} className="animate-float" />
              <p className="mt-4 font-semibold">{t('selectConversation')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
