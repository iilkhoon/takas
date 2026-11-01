'use client';

import { use } from 'react';
import { Messenger } from '@/components/Messenger';
import { useRequireAuth } from '@/lib/hooks';

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready } = useRequireAuth();
  return ready ? <Messenger activeId={id} /> : null;
}
