'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Select } from '@/components/Select';
import { Avatar, Spinner } from '@/components/ui';
import { routing } from '@/i18n/routing';

const LN: Record<string, string> = { az: 'Azərbaycan', en: 'English', tr: 'Türkçe', ru: 'Русский' };

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tt = useTranslations();
  const locale = useLocale();
  const { me } = useRequireAuth();
  const { refresh } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const errText = useErrorText();
  const router = useRouter();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [p, setP] = useState({ name: '', bio: '', city: 'baku', phone: '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (me) setP({ name: me.name, bio: me.bio ?? '', city: me.city, phone: me.phone ?? '' });
  }, [me]);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast(ok);
      await refresh();
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!me) return null;
  return (
    <div className="container max-w-2xl py-6 md:py-10">
      <h1 className="font-display text-3xl font-black">{t('title')}</h1>

      <section className="card mt-6 space-y-5 p-6">
        <h2 className="font-display text-lg font-bold">{t('profile')}</h2>
        <div className="flex items-center gap-4">
          <Avatar name={me.name} url={me.avatarUrl} size={80} />
          <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={busy === 'avatar'}>
            {busy === 'avatar' ? <Spinner className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {t('changeAvatar')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fd = new FormData();
              fd.append('file', f);
              run('avatar', () => api('/users/me/avatar', { method: 'POST', body: fd }), tt('common.saved'));
            }}
          />
        </div>
        <div>
          <label className="label">{tt('auth.name')}</label>
          <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} maxLength={60} />
        </div>
        <div>
          <label className="label">{t('bio')}</label>
          <textarea className="input resize-none" rows={3} placeholder={t('bioPh')} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={400} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{tt('auth.city')}</label>
            <Select value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })}>
              {meta?.cities.map((c) => <option key={c} value={c}>{tt(`cities.${c}`)}</option>)}
            </Select>
          </div>
          <div>
            <label className="label">{tt('auth.phone')}</label>
            <input className="input" type="tel" placeholder={tt('auth.phonePh')} value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy === 'profile'} onClick={() => run('profile', () => api('/users/me', { method: 'PATCH', body: p }), tt('common.saved'))}>
          {busy === 'profile' && <Spinner className="h-4 w-4" />}
          {tt('common.save')}
        </button>
      </section>

      {me.phone && (
        <section className="card mt-4 space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-xezer-500" />
            {t('verifyPhone')}
          </h2>
          {me.phoneVerified ? (
            <p className="font-bold text-xezer-600">{t('phoneVerified')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() =>
                  run('send', async () => {
                    const r = await api<{ devHint?: string }>('/auth/phone/send-code', { method: 'POST' });
                    setCodeSent(true);
                    if (r.devHint) setCode(r.devHint);
                  }, t('codeSent'))
                }
              >
                {t('sendCode')}
              </button>
              {codeSent && (
                <>
                  <input className="input w-40" inputMode="numeric" maxLength={6} placeholder={t('code')} value={code} onChange={(e) => setCode(e.target.value)} />
                  <button className="btn btn-teal btn-sm" onClick={() => run('verify', () => api('/auth/phone/verify', { method: 'POST', body: { code } }), t('phoneVerified'))}>
                    {t('verify')}
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      <section className="card mt-4 space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{t('language')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={async () => {
                await api('/users/me', { method: 'PATCH', body: { locale: l } }).catch(() => {});
                router.replace(pathname, { locale: l });
              }}
              className={`chip justify-center ${l === locale ? 'chip-active' : ''}`}
            >
              {LN[l]}
            </button>
          ))}
        </div>
      </section>

      <section className="card mt-4 space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{t('security')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('currentPassword')}</label>
            <input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('newPassword')}</label>
            <input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <p className="hint">{tt('auth.passwordHint')}</p>
          </div>
        </div>
        <button
          className="btn btn-dark"
          disabled={busy === 'pw' || pw.next.length < 8 || !pw.current}
          onClick={() => run('pw', async () => { await api('/auth/change-password', { method: 'POST', body: pw }); setPw({ current: '', next: '' }); }, t('passwordChanged'))}
        >
          {t('changePassword')}
        </button>
      </section>
    </div>
  );
}
