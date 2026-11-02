import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { pricing } from '../lib/config';
import { badRequest, forbidden, notFound, pageParams, parse, paymentRequired } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { category, listingCard, listingCardInclude, publicUser, publicUserSelect } from '../lib/serialize';
import { deleteImage } from '../lib/upload';
import { CITY_SLUGS } from '../lib/cities';

const router = Router();

const conditionEnum = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS']);

async function favSet(uid: string | undefined, ids: string[]) {
  if (!uid || !ids.length) return new Set<string>();
  const favs = await prisma.favorite.findMany({ where: { userId: uid, listingId: { in: ids } }, select: { listingId: true } });
  return new Set(favs.map((f) => f.listingId));
}

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(60).optional(),
  city: z.string().max(40).optional(),
  condition: z.union([conditionEnum, z.array(conditionEnum)]).optional(),
  minValue: z.coerce.number().int().min(0).optional(),
  maxValue: z.coerce.number().int().min(0).optional(),
  wants: z.string().max(60).optional(),
  acceptsCash: z.enum(['1', '0']).optional(),
  canShip: z.enum(['1', '0']).optional(),
  owner: z.string().max(40).optional(),
  swapType: z.enum(['ANY', 'EVEN', 'PAY_EXTRA', 'WANT_EXTRA']).optional(),
  seller: z.enum(['store', 'person']).optional(),
  store: z.string().max(60).optional(),
  sort: z.enum(['new', 'value_asc', 'value_desc', 'popular']).default('new'),
});

router.get('/', async (req, res) => {
  const f = parse(searchSchema, req.query);
  const { page, limit, skip } = pageParams(req.query as Record<string, unknown>);

  const and: Prisma.ListingWhereInput[] = [];
  const where: Prisma.ListingWhereInput = { status: 'ACTIVE', AND: and };
  if (f.owner) {
    where.ownerId = f.owner;
  }
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { wantedText: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  if (f.category) {
    const cat = await prisma.category.findUnique({ where: { slug: f.category }, include: { children: true } });
    if (cat) where.categoryId = { in: [cat.id, ...cat.children.map((c) => c.id)] };
  }
  if (f.city) where.city = f.city;
  if (f.condition) where.condition = { in: Array.isArray(f.condition) ? f.condition : [f.condition] };
  if (f.minValue !== undefined || f.maxValue !== undefined) {
    where.estimatedValue = { gte: f.minValue, lte: f.maxValue };
  }
  if (f.wants) and.push({ OR: [{ wantedCategories: { has: f.wants } }, { openToAnything: true }] });
  if (f.acceptsCash === '1') where.acceptsCash = true;
  if (f.canShip === '1') where.canShip = true;
  if (f.swapType) where.swapType = f.swapType;
  if (f.seller === 'store') where.owner = { store: { is: { active: true } } };
  if (f.seller === 'person') where.owner = { store: { is: null } };
  if (f.store) where.owner = { store: { is: { slug: f.store, active: true } } };

  const orderBy: Prisma.ListingOrderByWithRelationInput[] =
    f.sort === 'value_asc'
      ? [{ estimatedValue: 'asc' }]
      : f.sort === 'value_desc'
        ? [{ estimatedValue: 'desc' }]
        : f.sort === 'popular'
          ? [{ views: 'desc' }, { bumpedAt: 'desc' }]
          : [{ bumpedAt: 'desc' }];

  const [total, rows, vipRows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({ where, orderBy, skip, take: limit, include: listingCardInclude }),
    page === 1 && !f.owner
      ? prisma.listing.findMany({
          where: { ...where, vipUntil: { gt: new Date() } },
          orderBy: { bumpedAt: 'desc' },
          take: 4,
          include: listingCardInclude,
        })
      : Promise.resolve([]),
  ]);
  const favs = await favSet(req.user?.id, [...rows, ...vipRows].map((r) => r.id));
  res.json({
    items: rows.map((r) => listingCard(r, favs)),
    vip: vipRows.map((r) => listingCard(r, favs)),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/** Ana səhifə üçün toplu məlumat */
router.get('/home', async (req, res) => {
  const now = new Date();
  const [vip, latest, popular, stats] = await Promise.all([
    prisma.listing.findMany({
      where: { status: 'ACTIVE', vipUntil: { gt: now } },
      orderBy: { bumpedAt: 'desc' },
      take: 8,
      include: listingCardInclude,
    }),
    prisma.listing.findMany({ where: { status: 'ACTIVE' }, orderBy: { bumpedAt: 'desc' }, take: 12, include: listingCardInclude }),
    prisma.listing.findMany({
      where: { status: 'ACTIVE', createdAt: { gt: new Date(Date.now() - 30 * 864e5) } },
      orderBy: { views: 'desc' },
      take: 8,
      include: listingCardInclude,
    }),
    Promise.all([
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.offer.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count(),
    ]),
  ]);
  const favs = await favSet(req.user?.id, [...vip, ...latest, ...popular].map((r) => r.id));
  res.json({
    vip: vip.map((r) => listingCard(r, favs)),
    latest: latest.map((r) => listingCard(r, favs)),
    popular: popular.map((r) => listingCard(r, favs)),
    stats: { listings: stats[0], trades: stats[1], users: stats[2] },
  });
});

router.get('/mine', requireAuth, async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const rows = await prisma.listing.findMany({
    where: {
      ownerId: userId(req),
      ...(status === 'active' ? { status: 'ACTIVE' } : status === 'archived' ? { status: { in: ['ARCHIVED', 'TRADED', 'REJECTED'] } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: listingCardInclude,
  });
  res.json({ items: rows.map((r) => listingCard(r)) });
});

/** İki tərəfli uyğunluq: mənim istədiyim ≈ onların verdiyi və əksinə */
router.get('/matches', requireAuth, async (req, res) => {
  const uid = userId(req);
  const mine = await prisma.listing.findMany({ where: { ownerId: uid, status: 'ACTIVE' }, include: { category: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } });
  if (!mine.length) return res.json({ items: [] });

  const mySlugs = [...new Set(mine.map((m) => m.category.slug))];
  const wanted = [...new Set(mine.flatMap((m) => m.wantedCategories))];
  const anyOpen = mine.some((m) => m.openToAnything);

  const candidates = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      ownerId: { not: uid },
      AND: [
        anyOpen ? {} : { category: { slug: { in: wanted } } },
        { OR: [{ wantedCategories: { hasSome: mySlugs } }, { openToAnything: true }] },
      ],
    },
    orderBy: { bumpedAt: 'desc' },
    take: 120,
    include: listingCardInclude,
  });

  const pairs: { mine: (typeof mine)[number]; theirs: (typeof candidates)[number]; score: number; twoWay: boolean }[] = [];
  for (const t of candidates) {
    let best: (typeof pairs)[number] | null = null;
    for (const m of mine) {
      const iWant = m.openToAnything || m.wantedCategories.includes(t.category.slug);
      const theyWant = t.openToAnything || t.wantedCategories.includes(m.category.slug);
      if (!iWant || !theyWant) continue;
      const exact = m.wantedCategories.includes(t.category.slug) && t.wantedCategories.includes(m.category.slug);
      const ratio = Math.min(m.estimatedValue, t.estimatedValue) / Math.max(1, Math.max(m.estimatedValue, t.estimatedValue));
      const sameCity = m.city === t.city ? 10 : 0;
      const score = Math.round((exact ? 50 : 30) + ratio * 40 + sameCity);
      if (!best || score > best.score) best = { mine: m, theirs: t, score, twoWay: exact };
    }
    if (best) pairs.push(best);
  }
  pairs.sort((a, b) => b.score - a.score);
  const favs = await favSet(uid, pairs.map((p) => p.theirs.id));
  res.json({
    items: pairs.slice(0, 40).map((p) => ({
      score: Math.min(100, p.score),
      twoWay: p.twoWay,
      mine: { id: p.mine.id, title: p.mine.title, estimatedValue: p.mine.estimatedValue, image: p.mine.images[0] ?? null, category: category(p.mine.category) },
      theirs: listingCard(p.theirs, favs),
    })),
  });
});

/** "Kəşf et" — sürüşdürmə rejimi üçün kartlar */
router.get('/discover', requireAuth, async (req, res) => {
  const uid = userId(req);
  const mine = await prisma.listing.findMany({ where: { ownerId: uid, status: 'ACTIVE' }, select: { wantedCategories: true } });
  const wanted = [...new Set(mine.flatMap((m) => m.wantedCategories))];
  const base: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    ownerId: { not: uid },
    swipes: { none: { userId: uid } },
  };
  const preferred = wanted.length
    ? await prisma.listing.findMany({
        where: { ...base, category: { slug: { in: wanted } } },
        orderBy: { bumpedAt: 'desc' },
        take: 15,
        include: { ...listingCardInclude, images: { orderBy: { sortOrder: 'asc' }, take: 5 } },
      })
    : [];
  const rest = await prisma.listing.findMany({
    where: { ...base, id: { notIn: preferred.map((p) => p.id) } },
    orderBy: { bumpedAt: 'desc' },
    take: 20 - preferred.length,
    include: { ...listingCardInclude, images: { orderBy: { sortOrder: 'asc' }, take: 5 } },
  });
  res.json({
    items: [...preferred, ...rest].map((l) => ({ ...listingCard(l), images: l.images, description: l.description.slice(0, 220) })),
  });
});

router.post('/:id/swipe', requireAuth, async (req, res) => {
  const { liked } = parse(z.object({ liked: z.boolean() }), req.body);
  const uid = userId(req);
  const listingId = String(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw notFound();
  await prisma.swipe.upsert({
    where: { userId_listingId: { userId: uid, listingId } },
    create: { userId: uid, listingId, liked },
    update: { liked },
  });
  if (liked && listing.ownerId !== uid) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: uid, listingId } },
      create: { userId: uid, listingId },
      update: {},
    });
  }
  res.json({ ok: true });
});

router.post('/discover/reset', requireAuth, async (req, res) => {
  await prisma.swipe.deleteMany({ where: { userId: userId(req), liked: false } });
  res.json({ ok: true });
});

router.get('/:id', async (req, res) => {
  const id = String(req.params.id);
  const l = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      owner: { select: { ...publicUserSelect, bio: true } },
      _count: { select: { favorites: true, offersTargeting: true } },
    },
  });
  if (!l) throw notFound();
  const uid = req.user?.id;
  const isOwner = uid === l.ownerId;
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';
  if (l.status !== 'ACTIVE' && l.status !== 'RESERVED' && l.status !== 'TRADED' && !isOwner && !isStaff) throw notFound();

  if (!isOwner) {
    await prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } });
  }
  const [isFav, myPendingOffer, similar, ownerActive] = await Promise.all([
    uid ? prisma.favorite.findUnique({ where: { userId_listingId: { userId: uid, listingId: id } } }) : null,
    uid ? prisma.offer.findFirst({ where: { listingId: id, fromUserId: uid, status: { in: ['PENDING', 'ACCEPTED'] } }, select: { id: true, status: true } }) : null,
    prisma.listing.findMany({
      where: { status: 'ACTIVE', categoryId: l.categoryId, id: { not: id } },
      orderBy: { bumpedAt: 'desc' },
      take: 8,
      include: listingCardInclude,
    }),
    prisma.listing.count({ where: { ownerId: l.ownerId, status: 'ACTIVE' } }),
  ]);
  const wantedCats = l.wantedCategories.length
    ? await prisma.category.findMany({ where: { slug: { in: l.wantedCategories } } })
    : [];
  const favs = await favSet(uid, similar.map((s) => s.id));

  res.json({
    listing: {
      id: l.id,
      title: l.title,
      description: l.description,
      condition: l.condition,
      estimatedValue: l.estimatedValue,
      city: l.city,
      wantedText: l.wantedText,
      wantedCategories: wantedCats.map(category),
      acceptsCash: l.acceptsCash,
      swapType: l.swapType,
      extraCash: l.extraCash,
      openToAnything: l.openToAnything,
      canShip: l.canShip,
      status: l.status,
      views: l.views + (isOwner ? 0 : 1),
      isVip: !!l.vipUntil && l.vipUntil > new Date(),
      vipUntil: l.vipUntil,
      bumpedAt: l.bumpedAt,
      createdAt: l.createdAt,
      images: l.images,
      category: category(l.category),
      owner: { ...publicUser(l.owner), bio: l.owner.bio, activeListings: ownerActive },
      favorites: l._count.favorites,
      offers: l._count.offersTargeting,
      isFavorite: !!isFav,
      isOwner,
      myPendingOffer,
    },
    similar: similar.map((s) => listingCard(s, favs)),
  });
});

const imageSchema = z.object({
  url: z.string().regex(/^\/uploads\/listings\/[\w/-]+\.webp$/),
  thumbUrl: z.string().regex(/^\/uploads\/listings\/[\w/-]+\.webp$/),
});

const listingSchema = z.object({
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(4000),
  categorySlug: z.string().min(1),
  condition: conditionEnum,
  estimatedValue: z.coerce.number().int().min(0).max(10_000_000),
  city: z.enum(CITY_SLUGS as [string, ...string[]]),
  wantedText: z.string().trim().max(300).default(''),
  wantedCategories: z.array(z.string().max(60)).max(8).default([]),
  swapType: z.enum(['ANY', 'EVEN', 'PAY_EXTRA', 'WANT_EXTRA']).default('ANY'),
  extraCash: z.coerce.number().int().min(0).max(1_000_000).default(0),
  openToAnything: z.boolean().default(false),
  canShip: z.boolean().default(false),
  images: z.array(imageSchema).min(1).max(10),
});

/** Takas növündən pul sahələrini çıxarır. Başa baş = pul fərqi qəbul edilmir. */
function swapFields(body: { swapType: 'ANY' | 'EVEN' | 'PAY_EXTRA' | 'WANT_EXTRA'; extraCash: number }) {
  return {
    swapType: body.swapType,
    acceptsCash: body.swapType !== 'EVEN',
    extraCash: body.swapType === 'PAY_EXTRA' || body.swapType === 'WANT_EXTRA' ? body.extraCash : 0,
  };
}

async function activeLimit(uid: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: uid }, include: { store: true } });
  const plus = u.plan === 'PLUS' && (!u.planUntil || u.planUntil > new Date());
  if (plus) return pricing.plusActiveListings;
  if (u.store?.active) return pricing.storeActiveListings;
  return pricing.freeActiveListings;
}

router.post('/', requireAuth, async (req, res) => {
  const uid = userId(req);
  const body = parse(listingSchema, req.body);
  const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
  if (!cat) throw badRequest('invalid_category');

  const [count, limit] = await Promise.all([
    prisma.listing.count({ where: { ownerId: uid, status: { in: ['ACTIVE', 'RESERVED', 'PENDING_REVIEW'] } } }),
    activeLimit(uid),
  ]);
  if (count >= limit) throw paymentRequired('listing_limit_reached', { limit });

  const listing = await prisma.listing.create({
    data: {
      ownerId: uid,
      title: body.title,
      description: body.description,
      categoryId: cat.id,
      condition: body.condition,
      estimatedValue: body.estimatedValue,
      city: body.city,
      wantedText: body.wantedText,
      wantedCategories: body.wantedCategories,
      ...swapFields(body),
      openToAnything: body.openToAnything,
      canShip: body.canShip,
      images: { create: body.images.map((im, i) => ({ ...im, sortOrder: i })) },
    },
  });

  // Dəvət bonusu: dəvət olunan istifadəçinin ilk elanı
  const me = await prisma.user.findUniqueOrThrow({ where: { id: uid } });
  if (me.referredById && !me.referralRewarded) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: uid }, data: { referralRewarded: true, boostCredits: { increment: pricing.referralBoosts } } }),
      prisma.user.update({ where: { id: me.referredById }, data: { boostCredits: { increment: pricing.referralBoosts } } }),
      prisma.transaction.create({ data: { userId: uid, type: 'BONUS', status: 'SUCCESS', amount: 0, meta: { reason: 'referral', boosts: pricing.referralBoosts } } }),
      prisma.transaction.create({ data: { userId: me.referredById, type: 'BONUS', status: 'SUCCESS', amount: 0, meta: { reason: 'referral', boosts: pricing.referralBoosts } } }),
      prisma.notification.create({ data: { userId: me.referredById, type: 'referral_reward', data: { boosts: pricing.referralBoosts, name: me.name } } }),
      prisma.notification.create({ data: { userId: uid, type: 'referral_reward', data: { boosts: pricing.referralBoosts } } }),
    ]);
  }

  res.status(201).json({ id: listing.id });
});

async function ownListing(req: Parameters<typeof userId>[0], id: string) {
  const l = await prisma.listing.findUnique({ where: { id }, include: { images: true } });
  if (!l) throw notFound();
  if (l.ownerId !== userId(req) && req.user?.role !== 'ADMIN') throw forbidden();
  return l;
}

router.put('/:id', requireAuth, async (req, res) => {
  const l = await ownListing(req, String(req.params.id));
  if (l.status === 'TRADED') throw badRequest('listing_traded');
  const body = parse(listingSchema, req.body);
  const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
  if (!cat) throw badRequest('invalid_category');

  const keepUrls = new Set(body.images.map((i) => i.url));
  const removed = l.images.filter((im) => !keepUrls.has(im.url));
  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId: l.id } }),
    prisma.listing.update({
      where: { id: l.id },
      data: {
        title: body.title,
        description: body.description,
        categoryId: cat.id,
        condition: body.condition,
        estimatedValue: body.estimatedValue,
        city: body.city,
        wantedText: body.wantedText,
        wantedCategories: body.wantedCategories,
        ...swapFields(body),
        openToAnything: body.openToAnything,
        canShip: body.canShip,
        status: l.status === 'REJECTED' ? 'ACTIVE' : l.status,
        images: { create: body.images.map((im, i) => ({ ...im, sortOrder: i })) },
      },
    }),
  ]);
  await Promise.all(removed.flatMap((im) => [deleteImage(im.url), deleteImage(im.thumbUrl)]));
  res.json({ id: l.id });
});

router.post('/:id/status', requireAuth, async (req, res) => {
  const l = await ownListing(req, String(req.params.id));
  const { status } = parse(z.object({ status: z.enum(['ACTIVE', 'ARCHIVED']) }), req.body);
  if (l.status === 'TRADED' || l.status === 'REJECTED') throw badRequest('cannot_change_status');
  if (status === 'ACTIVE' && l.status !== 'ACTIVE') {
    const [count, limit] = await Promise.all([
      prisma.listing.count({ where: { ownerId: l.ownerId, status: { in: ['ACTIVE', 'RESERVED'] } } }),
      activeLimit(l.ownerId),
    ]);
    if (count >= limit) throw paymentRequired('listing_limit_reached', { limit });
  }
  await prisma.listing.update({ where: { id: l.id }, data: { status } });
  if (status === 'ARCHIVED') {
    await prisma.offer.updateMany({ where: { listingId: l.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
  }
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const l = await ownListing(req, String(req.params.id));
  const activeTrade = await prisma.offer.findFirst({
    where: { status: 'ACCEPTED', OR: [{ listingId: l.id }, { items: { some: { listingId: l.id } } }] },
  });
  if (activeTrade) throw badRequest('listing_in_active_trade');
  await prisma.listing.delete({ where: { id: l.id } });
  await Promise.all(l.images.flatMap((im) => [deleteImage(im.url), deleteImage(im.thumbUrl)]));
  res.json({ ok: true });
});

/** İrəli çək: əvvəlcə pulsuz kreditlərdən, yoxdursa balansdan */
router.post('/:id/bump', requireAuth, async (req, res) => {
  const l = await ownListing(req, String(req.params.id));
  if (l.status !== 'ACTIVE') throw badRequest('listing_not_active');
  if (Date.now() - l.bumpedAt.getTime() < 60 * 60 * 1000) throw badRequest('bump_too_soon');
  const uid = userId(req);
  const result = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: uid } });
    if (u.boostCredits > 0) {
      await tx.user.update({ where: { id: uid }, data: { boostCredits: { decrement: 1 } } });
      await tx.transaction.create({ data: { userId: uid, type: 'BUMP', status: 'SUCCESS', amount: 0, provider: 'credit', meta: { listingId: l.id } } });
      return 'credit';
    }
    if (u.balance < pricing.bump) throw paymentRequired('insufficient_balance', { need: pricing.bump, balance: u.balance });
    await tx.user.update({ where: { id: uid }, data: { balance: { decrement: pricing.bump } } });
    await tx.transaction.create({ data: { userId: uid, type: 'BUMP', status: 'SUCCESS', amount: -pricing.bump, meta: { listingId: l.id } } });
    return 'balance';
  });
  await prisma.listing.update({ where: { id: l.id }, data: { bumpedAt: new Date() } });
  res.json({ ok: true, paidWith: result });
});

router.post('/:id/vip', requireAuth, async (req, res) => {
  const l = await ownListing(req, String(req.params.id));
  if (l.status !== 'ACTIVE') throw badRequest('listing_not_active');
  const uid = userId(req);
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: uid } });
    if (u.balance < pricing.vip7) throw paymentRequired('insufficient_balance', { need: pricing.vip7, balance: u.balance });
    await tx.user.update({ where: { id: uid }, data: { balance: { decrement: pricing.vip7 } } });
    await tx.transaction.create({ data: { userId: uid, type: 'VIP', status: 'SUCCESS', amount: -pricing.vip7, meta: { listingId: l.id, days: pricing.vipDays } } });
    const from = l.vipUntil && l.vipUntil > new Date() ? l.vipUntil : new Date();
    await tx.listing.update({
      where: { id: l.id },
      data: { vipUntil: new Date(from.getTime() + pricing.vipDays * 864e5), bumpedAt: new Date() },
    });
  });
  res.json({ ok: true });
});

router.post('/:id/favorite', requireAuth, async (req, res) => {
  const uid = userId(req);
  const listingId = String(req.params.id);
  const l = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!l) throw notFound();
  const existing = await prisma.favorite.findUnique({ where: { userId_listingId: { userId: uid, listingId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_listingId: { userId: uid, listingId } } });
    return res.json({ isFavorite: false });
  }
  await prisma.favorite.create({ data: { userId: uid, listingId } });
  if (l.ownerId !== uid) {
    const recent = await prisma.notification.count({
      where: { userId: l.ownerId, type: 'listing_favorited', createdAt: { gt: new Date(Date.now() - 3600e3) } },
    });
    if (recent < 5) {
      await prisma.notification.create({ data: { userId: l.ownerId, type: 'listing_favorited', data: { listingId: l.id, title: l.title } } });
    }
  }
  res.json({ isFavorite: true });
});

export default router;
