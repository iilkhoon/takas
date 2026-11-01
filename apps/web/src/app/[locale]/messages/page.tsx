'use client';

import { Messenger } from '@/components/Messenger';
import { useRequireAuth } from '@/lib/hooks';

export default function MessagesPage() {
  const { ready } = useRequireAuth();
  return ready ? <Messenger /> : null;
}
