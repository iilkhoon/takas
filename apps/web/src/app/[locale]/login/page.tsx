'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSWRConfig } from 'swr';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { useAuth, useErrorText } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/ui';

function LoginForm() {
  const t = useTranslations('auth');
  const tn = useTranslations('nav');
  const sp = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const errText = useErrorText();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const doLogin = async (l: string, p: string) => {
    setBusy(true);
    try {
      await api('/auth/login', { method: 'POST', body: { login: l, password: p } });
      await refresh();
      await mutate(() => true);
      const next = sp.get('next');
      router.replace(next && next.startsWith('/') ? next : '/');
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('loginTitle')} sub={t('loginSub')}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          doLogin(login, password);
        }}
      >
        <div>
          <label className="label" htmlFor="login">{t('login')}</label>
          <input id="login" className="input" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pw">{t('password')}</label>
          <div className="relative">
            <input id="pw" type={show ? 'text' : 'password'} className="input pr-12" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink-mute hover:text-ink" aria-label="show">
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy ? <Spinner /> : <LogIn className="h-5 w-5" />}
          {t('submitLogin')}
        </button>
      </form>
      <button onClick={() => doLogin('elvin@demo.az', 'Demo12345!')} className="btn btn-outline mt-3 w-full" disabled={busy}>
        🎮 {t('demo')}
      </button>
      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('noAccount')}{' '}
        <Link href={`/register${sp.get('next') ? `?next=${encodeURIComponent(sp.get('next')!)}` : ''}`} className="font-bold text-nar-600 hover:underline">
          {tn('register')}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
