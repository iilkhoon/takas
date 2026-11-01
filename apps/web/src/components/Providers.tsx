'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';
import { useTranslations } from 'next-intl';
import { api, ApiError, fetcher } from '@/lib/api';
import type { Me, Meta } from '@/lib/types';
import { ToastProvider } from './Toast';

interface Counters {
  unreadNotifications: number;
  unreadMessages: number;
  pendingOffers: number;
}

interface AuthCtx {
  me: Me | null;
  counters: Counters;
  loading: boolean;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  me: null,
  counters: { unreadNotifications: 0, unreadMessages: 0, pendingOffers: 0 },
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

function AuthProvider({ children }: { children: ReactNode }) {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR<{ user: Me; counters: Counters } | null>(
    '/auth/me',
    async (p: string) => {
      if (typeof document !== 'undefined' && !document.cookie.includes('dy_li=1')) return null;
      try {
        return await api<{ user: Me; counters: Counters }>(p);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    { refreshInterval: 30000, revalidateOnFocus: true, shouldRetryOnError: false },
  );
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    await mutate(null, { revalidate: false });
    await globalMutate(() => true, undefined, { revalidate: true });
  }, [mutate, globalMutate]);
  return (
    <AuthContext.Provider
      value={{
        me: data?.user ?? null,
        counters: data?.counters ?? { unreadNotifications: 0, unreadMessages: 0, pendingOffers: 0 },
        loading: isLoading,
        refresh: () => mutate(),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 3000 }}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </SWRConfig>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useMeta() {
  const { data } = useSWR<Meta>('/meta', { revalidateOnFocus: false, dedupingInterval: 60000 });
  return data;
}

/** API xəta kodunu tərcümə olunmuş mətnə çevirir */
export function useErrorText() {
  const t = useTranslations('errors');
  return useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        return t.has(e.code) ? t(e.code) : t('server_error');
      }
      return t('network');
    },
    [t],
  );
}
