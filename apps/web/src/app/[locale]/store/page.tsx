'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { BadgeCheck, Camera, Check, ExternalLink, Plus, Power, Store as StoreIcon } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Select } from '@/components/Select';
import { Avatar, Emoji, Skeleton, Spinner } from '@/components/ui';
import type { Store } from '@/lib/types';

const COLORS = ['#FFDB1F', '#FF2E63', '#1FD68D', '#3D5AFE', '#FF9EC4', '#B8F35A', '#7DD3FC', '#0B0B0F'];

type Form = Pick<Store, 'name' | 'slug' | 'tagline' | 'description' | 'city' | 'address' | 'phone' | 'instagram' | 'website' | 'hours' | 'categories' | 'coverColor'>;

const empty = (city = 'baku'): Form => ({
  name: '',
  slug: '',
  tagline: '',
  description: '',
  city,
  address: '',
  phone: '',
  instagram: '',
  website: '',
  hours: '',
  categories: [],
  coverColor: '#FFDB1F',
});

export default function ManageStorePage() {
  const t = useTranslations();
  const ts = useTranslations('stores');
  const locale = useLocale() as 'az';
  const { ready, me } = useRequireAuth();
  const { refresh } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const errText = useErrorText();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, mutate } = useSWR<{ store: (Store & { active: boolean }) | null }>(ready ? '/stores/me/current' : null);
  const store = data?.store ?? null;

  const [f, setF] = useState<Form>(empty());
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [nameErr, setNameErr] = useState(false);

  useEffect(() => {
    if (data === undefined) return;
    if (data.store) {
      const s = data.store;
      setF({
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description,
        city: s.city,
        address: s.address,
        phone: s.phone,
        instagram: s.instagram,
        website: s.website,
        hours: s.hours,
        categories: s.categories,
        coverColor: s.coverColor,
      });
    } else setF(empty(me?.city));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const up = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggleCat = (slug: string) =>
    up('categories', f.categories.includes(slug) ? f.categories.filter((c) => c !== slug) : f.categories.length >= 8 ? f.categories : [...f.categories, slug]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) {
      setNameErr(true);
      document.getElementById('st-name')?.focus();
      return;
    }
    setBusy(true);
    try {
      if (store) {
        await api('/stores/me', { method: 'PATCH', body: f });
        toast(ts('saved'));
      } else {
        await api('/stores', { method: 'POST', body: f });
        toast(ts('created'));
      }
      await Promise.all([mutate(), refresh()]);
    } catch (err) {
      toast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setLogoBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api('/stores/me/logo', { method: 'POST', body: fd });
      await Promise.all([mutate(), refresh()]);
    } catch (err) {
      toast(errText(err), 'error');
    } finally {
      setLogoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const close = async () => {
    if (!confirm(ts('closeConfirm'))) return;
    try {
      await api('/stores/me', { method: 'DELETE' });
      toast(ts('closed'));
      await Promise.all([mutate(), refresh()]);
    } catch (err) {
      toast(errText(err), 'error');
    }
  };

  if (!ready || data === undefined)
    return (
      <div className="container max-w-5xl py-10">
        <Skeleton className="h-96 rounded-4xl" />
      </div>
    );

  const isActive = !!store?.active;

  return (
    <div className="container max-w-6xl py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge bg-lale-500 text-white">
            <StoreIcon className="h-3 w-3" strokeWidth={3} /> {ts('tag')}
          </span>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{store ? ts('manageTitle') : ts('createTitle')}</h1>
          {!store && <p className="mt-2 max-w-xl text-ink-soft">{ts('openSub')}</p>}
        </div>
        {isActive && store && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/stores/${store.slug}`} className="btn btn-outline">
              <ExternalLink className="h-4 w-4" />
              {ts('viewStore')}
            </Link>
            <Link href="/listings/new" className="btn btn-primary">
              <Plus className="h-4 w-4" strokeWidth={3} />
              {ts('newListing')}
            </Link>
          </div>
        )}
      </div>

      {store && !isActive && <div className="mt-6 rounded-2xl border-[2.5px] border-ink bg-zefran-300 px-5 py-4 font-semibold shadow-sm">{ts('reopenHint')}</div>}

      {!store && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[ts('b1', { count: meta?.pricing.storeActiveListings ?? 50 }), ts('b2'), ts('b3'), ts('b4')].map((b, i) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={clsx('flex items-center gap-3 rounded-2xl border-[2.5px] border-ink p-4 text-sm font-bold shadow-sm', ['bg-zefran-300', 'bg-lale-100', 'bg-xezer-200', 'bg-nar-100'][i])}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white">
                <Check className="h-4 w-4" strokeWidth={3.5} />
              </span>
              {b}
            </motion.li>
          ))}
        </ul>
      )}

      <form onSubmit={save} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section className="card space-y-5 p-5 sm:p-6">
            {store && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={f.name || '?'} url={store.logoUrl} size={84} square />
                  {logoBusy && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                      <Spinner />
                    </span>
                  )}
                </div>
                <div>
                  <div className="label mb-1">{ts('logo')}</div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm">
                    <Camera className="h-4 w-4" />
                    {ts('uploadLogo')}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="st-name">
                  {ts('name')}
                </label>
                <input
                  id="st-name"
                  className={clsx('input', nameErr && 'input-error')}
                  value={f.name}
                  maxLength={60}
                  onChange={(e) => {
                    up('name', e.target.value);
                    setNameErr(false);
                  }}
                  placeholder={ts('namePh')}
                />
                {store?.verified && <p className="hint">{ts('verifyNote')}</p>}
              </div>
              <div>
                <label className="label" htmlFor="st-slug">
                  {ts('slug')}
                </label>
                <div className="flex overflow-hidden rounded-xl border-[2.5px] border-ink bg-white focus-within:shadow-sm">
                  <span className="flex items-center border-r-2 border-ink bg-cream px-3 font-mono text-xs font-bold text-ink-mute">/stores/</span>
                  <input
                    id="st-slug"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm font-bold outline-none"
                    value={f.slug}
                    maxLength={40}
                    onChange={(e) => up('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="texnobazar"
                  />
                </div>
                <p className="hint">{ts('slugHint')}</p>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="st-tag">
                {ts('tagline')}
              </label>
              <input id="st-tag" className="input" value={f.tagline} maxLength={120} onChange={(e) => up('tagline', e.target.value)} placeholder={ts('taglinePh')} />
            </div>
            <div>
              <label className="label" htmlFor="st-desc">
                {ts('description')}
              </label>
              <textarea id="st-desc" rows={4} className="input resize-none" value={f.description} maxLength={2000} onChange={(e) => up('description', e.target.value)} placeholder={ts('descriptionPh')} />
            </div>
          </section>

          <section className="card space-y-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold">{ts('contact')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{ts('city')}</label>
                <Select value={f.city} onChange={(e) => up('city', e.target.value)}>
                  {meta?.cities.map((c) => (
                    <option key={c} value={c}>
                      {t(`cities.${c}`)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="label" htmlFor="st-addr">
                  {ts('address')}
                </label>
                <input id="st-addr" className="input" value={f.address} maxLength={200} onChange={(e) => up('address', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="st-phone">
                  {ts('phone')}
                </label>
                <input id="st-phone" type="tel" className="input" value={f.phone} maxLength={30} onChange={(e) => up('phone', e.target.value)} placeholder="+994 50 000 00 00" />
              </div>
              <div>
                <label className="label" htmlFor="st-hours">
                  {ts('hours')}
                </label>
                <input id="st-hours" className="input" value={f.hours} maxLength={120} onChange={(e) => up('hours', e.target.value)} placeholder={ts('hoursPh')} />
              </div>
              <div>
                <label className="label" htmlFor="st-ig">
                  {ts('instagram')}
                </label>
                <input id="st-ig" className="input" value={f.instagram} maxLength={60} onChange={(e) => up('instagram', e.target.value)} placeholder="@magaza" />
              </div>
              <div>
                <label className="label" htmlFor="st-web">
                  {ts('website')}
                </label>
                <input id="st-web" type="url" className="input" value={f.website} maxLength={200} onChange={(e) => up('website', e.target.value)} placeholder="https://" />
              </div>
            </div>
          </section>

          <section className="card space-y-5 p-5 sm:p-6">
            <div>
              <label className="label">{ts('categories')}</label>
              <div className="flex flex-wrap gap-2">
                {meta?.categories.map((c) => {
                  const on = f.categories.includes(c.slug);
                  return (
                    <button key={c.slug} type="button" onClick={() => toggleCat(c.slug)} className={clsx('chip', on && 'chip-active')}>
                      <Emoji name={c.icon} size={18} />
                      {c.name[locale] ?? c.name.az}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">{ts('coverColor')}</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => up('coverColor', c)}
                    aria-label={c}
                    className={clsx('flex h-10 w-10 items-center justify-center rounded-xl border-[2.5px] border-ink transition', f.coverColor === c ? '-translate-y-0.5 shadow-sm' : 'hover:-translate-y-0.5')}
                    style={{ backgroundColor: c }}
                  >
                    {f.coverColor === c && <Check className="h-5 w-5" strokeWidth={3.5} color={c === '#0B0B0F' || c === '#3D5AFE' ? '#fff' : '#0B0B0F'} />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={busy} className="btn btn-primary btn-lg flex-1">
              {busy ? <Spinner /> : <Check className="h-5 w-5" strokeWidth={3} />}
              {store ? ts('save') : ts('create')}
            </button>
            {isActive && (
              <button type="button" onClick={close} className="btn btn-outline btn-lg text-nar-600">
                <Power className="h-5 w-5" />
                {ts('close')}
              </button>
            )}
          </div>
        </div>

        {/* Canlı önizləmə */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="label">{ts('preview')}</div>
            <div className="overflow-hidden rounded-3xl border-[2.5px] border-ink bg-white shadow-lift">
              <div className="relative h-24 border-b-[2.5px] border-ink bg-dots" style={{ backgroundColor: f.coverColor }}>
                <span className="badge absolute right-3 top-3 bg-lale-500 text-white">
                  <StoreIcon className="h-3 w-3" strokeWidth={3} />
                  {ts('tag')}
                </span>
              </div>
              <div className="px-4 pb-5">
                <div className="relative z-10 -mt-8">
                  <Avatar name={f.name || '?'} url={store?.logoUrl} size={64} square className="shadow-sm" />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="truncate font-display text-lg font-extrabold">{f.name || ts('namePh')}</span>
                  {store?.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-lale-500" />}
                </div>
                <p className="line-clamp-2 text-sm text-ink-soft">{f.tagline || ts('taglinePh')}</p>
                <p className="mt-2 font-mono text-xs font-bold text-ink-mute">/stores/{f.slug || '…'}</p>
              </div>
            </div>
            <p className="text-xs text-ink-mute">{ts('limitNote', { count: meta?.pricing.storeActiveListings ?? 50 })}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
