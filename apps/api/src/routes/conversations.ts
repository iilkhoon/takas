import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { config } from '../lib/config';
import { badRequest, forbidden, notFound, parse } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { publicUser, publicUserSelect } from '../lib/serialize';
import { getOrCreateConversation } from '../lib/conversations';
import { notify } from '../lib/notify';

const router = Router();
router.use(requireAuth);

const msgLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.isProd ? 30 : 1000,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  message: { error: 'too_many_requests' },
});

router.get('/', async (req, res) => {
  const me = userId(req);
  const convs = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      userA: { select: publicUserSelect },
      userB: { select: publicUserSelect },
      listing: { select: { id: true, title: true, status: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  const unread = await prisma.message.groupBy({
    by: ['conversationId'],
    where: { conversationId: { in: convs.map((c) => c.id) }, senderId: { not: me }, readAt: null },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));
  res.json({
    items: convs.map((c) => {
      const other = c.userAId === me ? c.userB : c.userA;
      return {
        id: c.id,
        other: publicUser(other),
        listing: c.listing ? { id: c.listing.id, title: c.listing.title, status: c.listing.status, image: c.listing.images[0] ?? null } : null,
        lastMessage: c.messages[0] ?? null,
        lastMessageAt: c.lastMessageAt,
        unread: unreadMap.get(c.id) ?? 0,
      };
    }),
  });
});

/** Elan sahibinə sual vermək üçün söhbət başlat */
router.post('/', async (req, res) => {
  const me = userId(req);
  const { listingId, userId: otherId } = parse(z.object({ listingId: z.string().optional(), userId: z.string().optional() }), req.body);
  let target = otherId;
  if (listingId) {
    const l = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!l) throw notFound();
    target = l.ownerId;
  }
  if (!target) throw badRequest('missing_target');
  if (target === me) throw badRequest('self_conversation');
  const conv = await getOrCreateConversation(me, target, listingId ?? null);
  res.json({ id: conv.id });
});

async function loadConv(id: string, me: string) {
  const c = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: publicUserSelect },
      userB: { select: publicUserSelect },
      listing: { select: { id: true, title: true, status: true, estimatedValue: true, ownerId: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
    },
  });
  if (!c) throw notFound();
  if (c.userAId !== me && c.userBId !== me) throw forbidden();
  return c;
}

router.get('/:id', async (req, res) => {
  const me = userId(req);
  const c = await loadConv(String(req.params.id), me);
  const after = typeof req.query.after === 'string' ? new Date(req.query.after) : undefined;
  const messages = await prisma.message.findMany({
    where: { conversationId: c.id, ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: 'asc' },
    take: after ? 200 : 300,
  });
  await prisma.message.updateMany({ where: { conversationId: c.id, senderId: { not: me }, readAt: null }, data: { readAt: new Date() } });
  const offers = await prisma.offer.findMany({
    where: { conversationId: c.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, proposerId: true, cashAmount: true, createdAt: true },
  });
  const other = c.userAId === me ? c.userB : c.userA;
  res.json({
    conversation: {
      id: c.id,
      other: publicUser(other),
      listing: c.listing ? { ...c.listing, image: c.listing.images[0] ?? null } : null,
    },
    offers,
    messages,
  });
});

router.post('/:id/messages', msgLimiter, async (req, res) => {
  const me = userId(req);
  const c = await loadConv(String(req.params.id), me);
  const { body } = parse(z.object({ body: z.string().trim().min(1).max(2000) }), req.body);
  const msg = await prisma.message.create({ data: { conversationId: c.id, senderId: me, body } });
  await prisma.conversation.update({ where: { id: c.id }, data: { lastMessageAt: msg.createdAt } });
  const other = c.userAId === me ? c.userBId : c.userAId;
  // Bildiriş spamının qarşısını almaq: son 10 dəqiqədə bu söhbət üçün oxunmamış bildiriş varsa, yenisini yaratma
  const recent = await prisma.notification.findFirst({
    where: { userId: other, type: 'message', readAt: null, createdAt: { gt: new Date(Date.now() - 600e3) }, data: { path: ['conversationId'], equals: c.id } },
  });
  if (!recent) await notify(other, 'message', { conversationId: c.id, preview: body.slice(0, 80) });
  res.status(201).json({ message: msg });
});

export default router;
