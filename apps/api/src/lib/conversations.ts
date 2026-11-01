import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './db';

type Tx = Prisma.TransactionClient | PrismaClient;

/** İki istifadəçi arasında (elan üzrə) söhbəti tapır və ya yaradır. */
export async function getOrCreateConversation(u1: string, u2: string, listingId: string | null, tx: Tx = prisma) {
  const [userAId, userBId] = u1 < u2 ? [u1, u2] : [u2, u1];
  const existing = await tx.conversation.findFirst({ where: { userAId, userBId, listingId } });
  if (existing) return existing;
  return tx.conversation.create({ data: { userAId, userBId, listingId } });
}

export async function postSystemMessage(
  conversationId: string,
  senderId: string,
  body: string,
  opts: { kind?: 'SYSTEM' | 'OFFER'; offerId?: string } = {},
  tx: Tx = prisma,
) {
  await tx.message.create({
    data: { conversationId, senderId, body, kind: opts.kind ?? 'SYSTEM', offerId: opts.offerId },
  });
  await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
}
