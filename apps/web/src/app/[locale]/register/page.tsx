'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSWRConfig } from 'swr';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Select } from '@/components/Select';
import { Spinner } from '@/components/ui';

function RegisterForm() {
  const t = useTranslations('auth');
  const tt = useTranslations();
  const locale = useLocale();
  const sp = useSearchParams();
  const router = useRouter();
  const meta = useMeta();
  const { refresh } = useAuth();
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const errText = useErrorText();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', city: 'baku', referralCode: sp.get('ref') ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: { ...f, phone: f.phone || undefined, referralCode: f.referralCode || undefined, locale },
      });
      await refresh();
      await mutate(() => true);
      const next = sp.get('next');
      router.replace(next && next.startsWith('/') ? next : '/listings/new');
    } catch (err) {
      toast(errText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('registerTitle')} sub={t('registerSub')}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="name">{t('name')}</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={set('name')} required minLength={2} maxLength={60} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">{t('email')}</label>
            <input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              {t('phone')} <span className="font-normal text-ink-mute">({tt('common.optional')})</span>
            </label>
            <input id="phone" type="tel" className="input" autoComplete="tel" placeholder={t('phonePh')} value={f.phone} onChange={set('phone')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pw">{t('password')}</label>
            <input id="pw" type="password" className="input" autoComplete="new-password" value={f.password} onChange={set('password')} required minLength={8} />
            <p className="hint">{t('passwordHint')}</p>
          </div>
          <div>
            <label className="label">{t('city')}</label>
            <Select value={f.city} onChange={set('city')}>
              {meta?.cities.map((c) => (
                <option key={c} value={c}>{tt(`cities.${c}`)}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ref">
            {t('referral')} <span className="font-normal text-ink-mute">({tt('common.optional')})</span>
          </label>
          <input id="ref" className="input uppercase" value={f.referralCode} onChange={set('referralCode')} maxLength={12} />
        </div>
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy ? <Spinner /> : <UserPlus className="h-5 w-5" />}
          {t('submitRegister')}
        </button>
        <p className="text-center text-xs text-ink-mute">{t('terms')}</p>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-bold text-nar-600 hover:underline">{tt('nav.login')}</Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
