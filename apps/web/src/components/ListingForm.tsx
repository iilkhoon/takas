'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Camera, ImagePlus, Lightbulb, Star, X, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/api';
import { formatAzn } from '@/lib/format';
import type { Condition, Image, ListingDetail, SwapType } from '@/lib/types';
import { SwapBadge } from './Tags';
import { SWAP_STYLE } from '@/lib/swap';
import { useAuth, useErrorText, useMeta } from './Providers';
import { useToast } from './Toast';
import { Emoji, Spinner, Toggle } from './ui';
import { Select } from './Select';

const CONDITIONS: Condition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS'];

export function ListingForm({ initial }: { initial?: ListingDetail }) {
  const t = useTranslations('form');
  const tt = useTranslations();
  const locale = useLocale() as 'az';
  const meta = useMeta();
  const { me, refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const errText = useErrorText();
  const fileRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<Image[]>(initial?.images.map(({ url, thumbUrl }) => ({ url, thumbUrl })) ?? []);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categorySlug, setCategorySlug] = useState(initial?.category.slug ?? '');
  const [condition, setCondition] = useState<Condition>(initial?.condition ?? 'GOOD');
  const [value, setValue] = useState(initial ? String(initial.estimatedValue) : '');
  const [city, setCity] = useState(initial?.city ?? me?.city ?? 'baku');
  const [wantedCategories, setWanted] = useState<string[]>(initial?.wantedCategories.map((c) => c.slug) ?? []);
  const [wantedText, setWantedText] = useState(initial?.wantedText ?? '');
  const [openToAnything, setOpen] = useState(initial?.openToAnything ?? false);
  const [swapType, setSwapType] = useState<SwapType>(initial?.swapType ?? 'ANY');
  const [extraCash, setExtraCash] = useState(initial?.extraCash ? String(initial.extraCash) : '');
  const [canShip, setShip] = useState(initial?.canShip ?? false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [limitHit, setLimitHit] = useState<number | null>(null);

  const upload = async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 10 - images.length);
    if (!arr.length) return;
    setUploading(arr.length);
    try {
      const fd = new FormData();
      arr.forEach((f) => fd.append('files', f));
      const r = await api<{ images: Image[] }>('/uploads/images', { method: 'POST', body: fd });
      setImages((s) => [...s, ...r.images].slice(0, 10));
      setErrors((e) => ({ ...e, images: false }));
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setUploading(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleWanted = (slug: string) =>
    setWanted((w) => (w.includes(slug) ? w.filter((x) => x !== slug) : w.length >= 8 ? w : [...w, slug]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {
      images: images.length === 0,
      title: title.trim().length < 3,
      description: description.trim().length < 10,
      category: !categorySlug,
      value: value === '' || Number(value) < 0,
      extraCash: (swapType === 'PAY_EXTRA' || swapType === 'WANT_EXTRA') && !(Number(extraCash) > 0),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast(tt('errors.validation_error'), 'error');
      const first = Object.keys(errs).find((k) => errs[k]);
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setBusy(true);
    try {
      const body = {
        title,
        description,
        categorySlug,
        condition,
        estimatedValue: Number(value),
        city,
        wantedText,
        wantedCategories,
        openToAnything,
        swapType,
        extraCash: swapType === 'PAY_EXTRA' || swapType === 'WANT_EXTRA' ? Number(extraCash) || 0 : 0,
        canShip,
        images,
      };
      const r = initial
        ? await api<{ id: string }>(`/listings/${initial.id}`, { method: 'PUT', body })
        : await api<{ id: string }>('/listings', { method: 'POST', body });
      toast(initial ? t('updated') : t('published'));
      await refresh();
      router.push(`/listings/${r.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'listing_limit_reached') {
        setLimitHit((err.details as { limit: number })?.limit ?? 5);
      } else toast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const cat = meta?.categories.find((c) => c.slug === categorySlug);

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]" noValidate>
      <div className="min-w-0 space-y-6">
        {/* ŞƏKİLLƏR */}
        <section id="f-images" className={clsx('card p-5 sm:p-6', errors.images && 'border-nar-500')}>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-nar-500 font-mono text-sm text-white">1</span>
            {t('photos')}
          </h2>
          <p className="hint mb-4">{t('photosHint')}</p>

          {images.length > 0 && (
            <Reorder.Group axis="x" values={images} onReorder={setImages} className="mb-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((im, i) => (
                <Reorder.Item key={im.url} value={im} className="relative h-28 w-28 shrink-0 cursor-grab overflow-hidden rounded-2xl border-2 border-line bg-cream active:cursor-grabbing">
                  <img src={im.thumbUrl} alt="" className="pointer-events-none h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-nar-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">{t('cover')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setImages((s) => [im, ...s.filter((x) => x !== im)])}
                      className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold"
                    >
                      <Star className="h-3 w-3" />
                      {t('makeCover')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((s) => s.filter((x) => x !== im))}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white transition hover:bg-nar-500"
                    aria-label={tt('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {images.length < 10 && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                upload(e.dataTransfer.files);
              }}
              className={clsx(
                'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 py-8 text-center transition',
                drag ? 'border-nar-500 bg-nar-100' : 'border-ink/15 bg-cream/60 hover:border-nar-300 hover:bg-nar-100/50',
              )}
            >
              {uploading ? (
                <>
                  <Spinner className="h-8 w-8 text-nar-500" />
                  <span className="mt-3 text-sm font-bold">{t('uploading')}</span>
                </>
              ) : (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
                    <ImagePlus className="h-7 w-7 text-nar-500" />
                  </span>
                  <span className="mt-3 text-sm font-bold">{t('dropHere')}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-ink-mute">
                    <Camera className="h-3.5 w-3.5" /> {images.length}/10
                  </span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
            </label>
          )}
        </section>

        {/* MƏLUMAT */}
        <section className="card space-y-5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-nar-500 font-mono text-sm text-white">2</span>
            {t('step2')}
          </h2>
          <div id="f-title">
            <label className="label" htmlFor="title">
              {t('title')}
            </label>
            <input id="title" className={clsx('input', errors.title && 'input-error')} value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePh')} />
            <div className="hint text-right">{title.length}/90</div>
          </div>
          <div id="f-category">
            <label className="label">{t('category')}</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {meta?.categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-center text-[11px] font-bold leading-tight transition',
                    categorySlug === c.slug ? 'border-nar-500 bg-nar-100 text-ink' : errors.category ? 'border-nar-200' : 'border-line hover:border-ink/20',
                  )}
                >
                  <Emoji name={c.icon} size={30} />
                  <span className="line-clamp-2">{c.name[locale] ?? c.name.az}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('condition')}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  title={tt(`condHint.${c}`)}
                  className={clsx('rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition', condition === c ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink/20')}
                >
                  {tt(`cond.${c}`)}
                </button>
              ))}
            </div>
            <p className="hint">{tt(`condHint.${condition}`)}</p>
          </div>
          <div id="f-description">
            <label className="label" htmlFor="desc">
              {t('description')}
            </label>
            <textarea
              id="desc"
              rows={5}
              className={clsx('input resize-y', errors.description && 'input-error')}
              value={description}
              maxLength={4000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPh')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div id="f-value">
              <label className="label" htmlFor="value">
                {t('value')}
              </label>
              <div className="relative">
                <input
                  id="value"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={clsx('input pr-10', errors.value && 'input-error')}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-ink-mute">₼</span>
              </div>
              <p className="hint">{t('valueHint')}</p>
            </div>
            <div>
              <label className="label">{t('city')}</label>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                {meta?.cities.map((c) => (
                  <option key={c} value={c}>
                    {tt(`cities.${c}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {/* İSTƏKLƏR */}
        <section className="card space-y-5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink bg-xezer-400 font-mono text-sm text-ink">3</span>
            {t('step3')}
          </h2>
          <div>
            <label className="label">{t('wantedCategories')}</label>
            <p className="hint -mt-1 mb-3">{t('wantedCategoriesHint')}</p>
            <div className="flex flex-wrap gap-2">
              {meta?.categories.map((c) => {
                const on = wantedCategories.includes(c.slug);
                return (
                  <button key={c.slug} type="button" onClick={() => toggleWanted(c.slug)} className={clsx('chip', on && 'chip-active')}>
                    <Emoji name={c.icon} size={18} />
                    {c.name[locale] ?? c.name.az}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="wanted">
              {t('wantedText')}
            </label>
            <input id="wanted" className="input" value={wantedText} maxLength={300} onChange={(e) => setWantedText(e.target.value)} placeholder={t('wantedTextPh')} />
          </div>
          <div id="f-extraCash">
            <label className="label">{t('swapType')}</label>
            <p className="hint -mt-1 mb-3">{t('swapTypeHint')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['ANY', 'EVEN', 'WANT_EXTRA', 'PAY_EXTRA'] as SwapType[]).map((k) => {
                const on = swapType === k;
                const Icon = SWAP_STYLE[k].icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSwapType(k)}
                    className={clsx(
                      'flex items-start gap-3 rounded-2xl border-[2.5px] border-ink p-3 text-left transition',
                      on ? `${k === 'ANY' ? 'bg-ink text-white' : SWAP_STYLE[k].cls} -translate-x-0.5 -translate-y-0.5 shadow-[4px_4px_0_0_#FF2E63]` : 'bg-white hover:shadow-sm',
                    )}
                  >
                    <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink', on ? 'bg-white text-ink' : SWAP_STYLE[k].cls)}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold">{tt(`swap.type.${k}`)}</span>
                      <span className={clsx('mt-0.5 block text-xs', on ? 'opacity-80' : 'text-ink-mute')}>{tt(`swap.desc.${k}`)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence initial={false}>
              {(swapType === 'PAY_EXTRA' || swapType === 'WANT_EXTRA') && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-3">
                    <label className="label" htmlFor="extra">
                      {t(swapType === 'PAY_EXTRA' ? 'extraPay' : 'extraWant')}
                    </label>
                    <div className="relative">
                      <input
                        id="extra"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        className={clsx('input pr-10 font-mono font-bold', errors.extraCash && 'input-error')}
                        value={extraCash}
                        onChange={(e) => {
                          setExtraCash(e.target.value);
                          setErrors((x) => ({ ...x, extraCash: false }));
                        }}
                        placeholder="50"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-ink-mute">₼</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="grid gap-2">
            <Toggle checked={openToAnything} onChange={setOpen} label={t('openToAnything')} />
            <Toggle checked={canShip} onChange={setShip} label={t('canShip')} />
          </div>
        </section>

        <AnimatePresence>
          {limitHit !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border-[2.5px] border-ink bg-zefran-300 p-5 shadow-card">
              <p className="font-semibold">{t('limitReached', { limit: limitHit })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/my-listings" className="btn btn-outline btn-sm">
                  {tt('nav.myListings')}
                </Link>
                <Link href="/pricing" className="btn btn-gold btn-sm">
                  Plus
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={busy || uploading > 0} className="btn btn-primary btn-lg w-full">
          {busy ? <Spinner /> : <CheckCircle2 className="h-5 w-5" />}
          {initial ? t('update') : t('publish')}
        </button>
      </div>

      {/* ÖNİZLƏMƏ */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">{t('previewTitle')}</div>
          <div className="overflow-hidden rounded-3xl border-[2.5px] border-ink bg-white shadow-lift">
            <div className="flex aspect-[4/3] items-center justify-center bg-cream-deep">
              {images[0] ? <img src={images[0].thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={cat?.icon ?? 'package'} size={80} className="opacity-60" />}
            </div>
            <div className="p-4">
              <div className="line-clamp-2 min-h-[2.5rem] font-bold">{title || t('titlePh')}</div>
              <div className="mt-1 font-display text-lg font-bold text-nar-600">≈ {formatAzn(Number(value) || 0, locale)}</div>
              <div className="mt-2">
                <SwapBadge type={swapType} amount={Number(extraCash) || 0} />
              </div>
              <div className="mt-3 rounded-2xl bg-cream px-3 py-2 text-sm">
                <div className="text-[11px] font-extrabold uppercase text-ink-mute">{tt('listing.wants')}</div>
                <div className="line-clamp-1 font-semibold text-ink-soft">{wantedText || (openToAnything ? tt('listing.openToAnything') : '—')}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 border-[2.5px] border-ink">
            <div className="flex items-center gap-2 font-bold">
              <Lightbulb className="h-5 w-5 text-zefran-500" />
              {t('tips')}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {[t('tip1'), t('tip2'), t('tip3'), t('tip4')].map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-xezer-500">✓</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </form>
  );
}
