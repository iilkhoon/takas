import { Router } from 'express';
import { z } from 'zod';
import type { Offer, Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { pricing } from '../lib/config';
import { badRequest, conflict, forbidden, notFound, parse } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { listingCard, listingCardInclude, publicUser, publicUserSelect } from '../lib/serialize';
import { getOrCreateConversation, postSystemMessage } from '../lib/conversations';
import { notify } from '../lib/notify';

const router = Router();
router.use(requireAuth);

const offerInclude = {
  listing: { include: listingCardInclude },
  items: { include: { listing: { include: listingCardInclude } } },
  fromUser: { select: publicUserSelect },
  toUser: { select: publicUserSelect },
  reviews: true,
} satisfies Prisma.OfferInclude;

type OfferRow = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;

function serialize(o: OfferRow, me: string) {
  const offeredValue = o.items.reduce((s, it) => s + it.listing.estimatedValue, 0) + o.cashAmount;
  return {
    id: o.id,
    status: o.status,
    cashAmount: o.cashAmount,
    message: o.message,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    completedAt: o.completedAt,
    parentOfferId: o.parentOfferId,
    conversationId: o.conversationId,
    proposerId: o.proposerId,
    fromConfirmed: o.fromConfirmed,
    toConfirmed: o.toConfirmed,
    listing: listingCard(o.listing),
    items: o.items.map((it) => listingCard(it.listing)),
    fromUser: publicUser(o.fromUser),
    toUser: publicUser(o.toUser),
    role: o.fromUserId === me ? 'sender' : 'receiver',
    /** Bu təklifə cavab verməli olan mənəmmi? */
    myTurn: o.status === 'PENDING' && o.proposerId !== me,
    myConfirmed: o.fromUserId === me ? o.fromConfirmed : o.toConfirmed,
    reviewed: o.reviews.some((r) => r.authorId === me),
    fairness: {
      targetValue: o.listing.estimatedValue,
      offeredValue,
      ratio: o.listing.estimatedValue ? offeredValue / o.listing.estimatedValue : 1,
    },
  };
}

async function loadOffer(id: string, me: string) {
  const o = await prisma.offer.findUnique({ where: { id }, include: offerInclude });
  if (!o) throw notFound();
  if (o.fromUserId !== me && o.toUserId !== me) throw forbidden();
  return o;
}

const createSchema = z.object({
  listingId: z.string().min(1),
  offeredListingIds: z.array(z.string()).max(5).default([]),
  cashAmount: z.coerce.number().int().min(-1_000_000).max(1_000_000).default(0),
  message: z.string().trim().max(1000).default(''),
});

async function validateItems(ids: string[], ownerId: string) {
  if (!ids.length) return [];
  const items = await prisma.listing.findMany({ where: { id: { in: ids }, ownerId, status: 'ACTIVE' } });
  if (items.length !== new Set(ids).size) throw badRequest('invalid_offered_items');
  return items;
}

router.post('/', async (req, res) => {
  const me = userId(req);
  const body = parse(createSchema, req.body);
  const target = await prisma.listing.findUnique({ where: { id: body.listingId } });
  if (!target || target.status !== 'ACTIVE') throw badRequest('listing_unavailable');
  if (target.ownerId === me) throw badRequest('own_listing');
  if (!body.offeredListingIds.length && body.cashAmount <= 0) throw badRequest('empty_offer');
  if (body.cashAmount !== 0 && !target.acceptsCash) throw badRequest('cash_not_accepted');
  await validateItems(body.offeredListingIds, me);

  const dup = await prisma.offer.findFirst({
    where: { listingId: target.id, fromUserId: me, status: { in: ['PENDING', 'ACCEPTED'] } },
  });
  if (dup) throw conflict('offer_exists');

  const offer = await prisma.$transaction(async (tx) => {
    const conv = await getOrCreateConversation(me, target.ownerId, target.id, tx);
    const created = await tx.offer.create({
      data: {
        listingId: target.id,
        fromUserId: me,
        toUserId: target.ownerId,
        proposerId: me,
        cashAmount: body.cashAmount,
        message: body.message,
        conversationId: conv.id,
        items: { create: body.offeredListingIds.map((listingId) => ({ listingId })) },
      },
    });
    await postSystemMessage(conv.id, me, 'offer_created', { kind: 'OFFER', offerId: created.id }, tx);
    if (body.message) {
      await tx.message.create({ data: { conversationId: conv.id, senderId: me, body: body.message } });
    }
    return created;
  });
  await notify(target.ownerId, 'offer_received', { offerId: offer.id, listingId: target.id, title: target.title });
  res.status(201).json({ id: offer.id, conversationId: offer.conversationId });
});

router.get('/', async (req, res) => {
  const me = userId(req);
  const box = String(req.query.box ?? 'all');
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
  const where: Prisma.OfferWhereInput =
    box === 'incoming' ? { toUserId: me } : box === 'outgoing' ? { fromUserId: me } : { OR: [{ fromUserId: me }, { toUserId: me }] };
  if (status === 'ACTIVE') where.status = { in: ['PENDING', 'ACCEPTED'] };
  else if (status === 'CLOSED') where.status = { in: ['REJECTED', 'CANCELLED', 'COUNTERED', 'COMPLETED'] };
  else if (status) where.status = status as Offer['status'];
  const rows = await prisma.offer.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 100, include: offerInclude });
  res.json({ items: rows.map((o) => serialize(o, me)) });
});

router.get('/:id', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  res.json({ offer: serialize(o, me) });
});

router.post('/:id/accept', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status !== 'PENDING') throw badRequest('offer_not_pending');
  if (o.proposerId === me) throw forbidden('not_your_turn');
  const allIds = [o.listingId, ...o.items.map((i) => i.listingId)];
  const unavailable = await prisma.listing.count({ where: { id: { in: allIds }, status: { not: 'ACTIVE' } } });
  if (unavailable) throw badRequest('items_unavailable');

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: o.id }, data: { status: 'ACCEPTED' } });
    await tx.listing.updateMany({ where: { id: { in: allIds } }, data: { status: 'RESERVED' } });
    if (o.conversationId) await postSystemMessage(o.conversationId, me, 'offer_accepted', { offerId: o.id }, tx);
  });
  const other = o.fromUserId === me ? o.toUserId : o.fromUserId;
  await notify(other, 'offer_accepted', { offerId: o.id, title: o.listing.title });
  res.json({ ok: true });
});

router.post('/:id/reject', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status !== 'PENDING') throw badRequest('offer_not_pending');
  if (o.proposerId === me) throw forbidden('not_your_turn');
  await prisma.offer.update({ where: { id: o.id }, data: { status: 'REJECTED' } });
  if (o.conversationId) await postSystemMessage(o.conversationId, me, 'offer_rejected', { offerId: o.id });
  await notify(o.proposerId, 'offer_rejected', { offerId: o.id, title: o.listing.title });
  res.json({ ok: true });
});

router.post('/:id/cancel', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status === 'PENDING') {
    if (o.proposerId !== me) throw forbidden('only_proposer_can_cancel');
  } else if (o.status !== 'ACCEPTED') {
    throw badRequest('cannot_cancel');
  }
  const allIds = [o.listingId, ...o.items.map((i) => i.listingId)];
  await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: o.id }, data: { status: 'CANCELLED', fromConfirmed: false, toConfirmed: false } });
    if (o.status === 'ACCEPTED') {
      await tx.listing.updateMany({ where: { id: { in: allIds }, status: 'RESERVED' }, data: { status: 'ACTIVE' } });
    }
    if (o.conversationId) await postSystemMessage(o.conversationId, me, 'offer_cancelled', { offerId: o.id }, tx);
  });
  const other = o.fromUserId === me ? o.toUserId : o.fromUserId;
  await notify(other, 'offer_cancelled', { offerId: o.id, title: o.listing.title });
  res.json({ ok: true });
});

const counterSchema = z.object({
  offeredListingIds: z.array(z.string()).max(5).default([]),
  cashAmount: z.coerce.number().int().min(-1_000_000).max(1_000_000).default(0),
  message: z.string().trim().max(1000).default(''),
});

/**
 * Əks-təklif: cavab verən tərəf, təklif edənin elanlarından fərqli dəst və/və ya fərqli məbləğ təklif edir.
 * Yeni təklif yaradılır, köhnəsi COUNTERED olur. Növbə yenidən qarşı tərəfə keçir.
 */
router.post('/:id/counter', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status !== 'PENDING') throw badRequest('offer_not_pending');
  if (o.proposerId === me) throw forbidden('not_your_turn');
  const body = parse(counterSchema, req.body);
  if (!body.offeredListingIds.length && body.cashAmount <= 0) throw badRequest('empty_offer');
  if (body.cashAmount !== 0 && !o.listing.acceptsCash) throw badRequest('cash_not_accepted');
  await validateItems(body.offeredListingIds, o.fromUserId);

  const created = await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: o.id }, data: { status: 'COUNTERED' } });
    const c = await tx.offer.create({
      data: {
        listingId: o.listingId,
        fromUserId: o.fromUserId,
        toUserId: o.toUserId,
        proposerId: me,
        cashAmount: body.cashAmount,
        message: body.message,
        parentOfferId: o.id,
        conversationId: o.conversationId,
        items: { create: body.offeredListingIds.map((listingId) => ({ listingId })) },
      },
    });
    if (o.conversationId) {
      await postSystemMessage(o.conversationId, me, 'offer_countered', { kind: 'OFFER', offerId: c.id }, tx);
      if (body.message) await tx.message.create({ data: { conversationId: o.conversationId, senderId: me, body: body.message } });
    }
    return c;
  });
  const other = o.fromUserId === me ? o.toUserId : o.fromUserId;
  await notify(other, 'offer_countered', { offerId: created.id, title: o.listing.title });
  res.status(201).json({ id: created.id });
});

/** Hər iki tərəf takasın baş tutduğunu təsdiqləyir → COMPLETED */
router.post('/:id/complete', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status !== 'ACCEPTED') throw badRequest('offer_not_accepted');
  const isFrom = o.fromUserId === me;
  const fromConfirmed = isFrom ? true : o.fromConfirmed;
  const toConfirmed = isFrom ? o.toConfirmed : true;
  const done = fromConfirmed && toConfirmed;
  const allIds = [o.listingId, ...o.items.map((i) => i.listingId)];
  const other = isFrom ? o.toUserId : o.fromUserId;

  const rewards = await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: o.id },
      data: { fromConfirmed, toConfirmed, ...(done ? { status: 'COMPLETED', completedAt: new Date() } : {}) },
    });
    if (!done) {
      if (o.conversationId) await postSystemMessage(o.conversationId, me, 'trade_confirmed_one', { offerId: o.id }, tx);
      return [] as string[];
    }
    await tx.listing.updateMany({ where: { id: { in: allIds } }, data: { status: 'TRADED' } });
    // Bu elanlara aid digər açıq təklifləri ləğv et
    await tx.offer.updateMany({
      where: {
        id: { not: o.id },
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [{ listingId: { in: allIds } }, { items: { some: { listingId: { in: allIds } } } }],
      },
      data: { status: 'CANCELLED' },
    });
    const rewarded: string[] = [];
    for (const uid of [o.fromUserId, o.toUserId]) {
      const u = await tx.user.update({ where: { id: uid }, data: { completedTrades: { increment: 1 } } });
      // Sadiqlik proqramı: hər 5 takasdan sonra 1 pulsuz irəli çəkmə
      if (u.completedTrades % pricing.loyaltyEvery === 0) {
        await tx.user.update({ where: { id: uid }, data: { boostCredits: { increment: 1 } } });
        await tx.transaction.create({
          data: { userId: uid, type: 'BONUS', status: 'SUCCESS', amount: 0, meta: { reason: 'loyalty', trades: u.completedTrades } },
        });
        rewarded.push(uid);
      }
    }
    if (o.conversationId) await postSystemMessage(o.conversationId, me, 'trade_completed', { offerId: o.id }, tx);
    return rewarded;
  });

  await notify(other, done ? 'trade_completed' : 'confirm_requested', { offerId: o.id, title: o.listing.title });
  if (done) await notify(me, 'trade_completed', { offerId: o.id, title: o.listing.title });
  for (const uid of rewards) await notify(uid, 'loyalty_reward', { boosts: 1 });
  res.json({ ok: true, completed: done });
});

router.post('/:id/review', async (req, res) => {
  const me = userId(req);
  const o = await loadOffer(String(req.params.id), me);
  if (o.status !== 'COMPLETED') throw badRequest('trade_not_completed');
  const body = parse(z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(500).default('') }), req.body);
  if (o.reviews.some((r) => r.authorId === me)) throw conflict('already_reviewed');
  const targetId = o.fromUserId === me ? o.toUserId : o.fromUserId;
  await prisma.$transaction([
    prisma.review.create({ data: { offerId: o.id, authorId: me, targetId, rating: body.rating, comment: body.comment } }),
    prisma.user.update({ where: { id: targetId }, data: { ratingSum: { increment: body.rating }, ratingCount: { increment: 1 } } }),
  ]);
  await notify(targetId, 'review_received', { rating: body.rating, offerId: o.id });
  res.json({ ok: true });
});

export default router;
