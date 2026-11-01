'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/components/Providers';

/** Daxil olmayıbsa login səhifəsinə yönləndirir */
export function useRequireAuth() {
  const { me, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, me, router, pathname]);
  return { me, ready: !loading && !!me };
}
