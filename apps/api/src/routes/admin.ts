import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { notFound, pageParams, parse } from '../lib/http';
import { requireRole, userId } from '../lib/auth';
import { listingCard, listingCardInclude, selfUser } from '../lib/serialize';
import { notify } from '../lib/notify';

const router = Router();
router.use(requireRole('ADMIN', 'MODERATOR'));

router.get('/stats', async (_req, res) => {
  const day = new Date(Date.now() - 864e5);
  const week = new Date(Date.now() - 7 * 864e5);
  const [users, usersWeek, listings, listingsDay, offers, completed, openReports, revenue, plus] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gt: week } } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.count({ where: { createdAt: { gt: day } } }),
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'COMPLETED' } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.transaction.aggregate({ where: { type: 'TOPUP', status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.user.count({ where: { plan: 'PLUS', planUntil: { gt: new Date() } } }),
  ]);
  res.json({ users, usersWeek, listings, listingsDay, offers, completed, openReports, revenue: revenue._sum.amount ?? 0, plus });
});

router.get('/reports', async (req, res) => {
  const status = (String(req.query.status ?? 'OPEN').toUpperCase() as 'OPEN' | 'RESOLVED' | 'DISMISSED');
  const items = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      reporter: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, status: true } },
      user: { select: { id: true, name: true } },
    },
  });
  res.json({ items });
});

router.post('/reports/:id', async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['RESOLVED', 'DISMISSED']) }), req.body);
  await prisma.report.update({ where: { id: String(req.params.id) }, data: { status } });
  res.json({ ok: true });
});

router.get('/listings', async (req, res) => {
  const { skip, limit, page } = pageParams(req.query as Record<string, unknown>);
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const where = q ? { title: { contains: q, mode: 'insensitive' as const } } : {};
  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: listingCardInclude }),
  ]);
  res.json({ items: rows.map((r) => listingCard(r)), total, page, pages: Math.ceil(total / limit) });
});

router.post('/listings/:id/moderate', async (req, res) => {
  const { action, reason } = parse(z.object({ action: z.enum(['approve', 'reject']), reason: z.string().max(300).default('') }), req.body);
  const l = await prisma.listing.findUnique({ where: { id: String(req.params.id) } });
  if (!l) throw notFound();
  await prisma.listing.update({ where: { id: l.id }, data: { status: action === 'approve' ? 'ACTIVE' : 'REJECTED' } });
  if (action === 'reject') {
    await prisma.offer.updateMany({ where: { listingId: l.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    await notify(l.ownerId, 'listing_rejected', { listingId: l.id, title: l.title, reason });
  }
  res.json({ ok: true });
});

router.get('/users', async (req, res) => {
  const { skip, limit, page } = pageParams(req.query as Record<string, unknown>);
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
  ]);
  res.json({ items: rows.map((u) => ({ ...selfUser(u), isBanned: u.isBanned })), total, page, pages: Math.ceil(total / limit) });
});

router.post('/users/:id', async (req, res) => {
  const body = parse(
    z.object({
      isBanned: z.boolean().optional(),
      addBalance: z.number().int().min(-100000).max(100000).optional(),
      addBoosts: z.number().int().min(-100).max(100).optional(),
    }),
    req.body,
  );
  const id = String(req.params.id);
  if (id === userId(req) && body.isBanned) throw notFound();
  await prisma.user.update({
    where: { id },
    data: {
      isBanned: body.isBanned,
      balance: body.addBalance ? { increment: body.addBalance } : undefined,
      boostCredits: body.addBoosts ? { increment: body.addBoosts } : undefined,
    },
  });
  if (body.isBanned) {
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.listing.updateMany({ where: { ownerId: id, status: 'ACTIVE' }, data: { status: 'ARCHIVED' } });
  }
  if (body.addBalance) {
    await prisma.transaction.create({ data: { userId: id, type: 'BONUS', status: 'SUCCESS', amount: body.addBalance, provider: 'admin' } });
  }
  res.json({ ok: true });
});

const adSchema = z.object({
  placement: z.enum(['home_top', 'home_middle', 'search_inline', 'listing_sidebar']),
  title: z.string().min(1).max(120),
  imageUrl: z.string().min(1).max(500),
  linkUrl: z.string().url(),
  advertiser: z.string().max(120).default(''),
  active: z.boolean().default(true),
  endsAt: z.string().datetime().nullable().optional(),
});

router.get('/ads', async (_req, res) => {
  res.json({ items: await prisma.adBanner.findMany({ orderBy: { createdAt: 'desc' } }) });
});

router.post('/ads', async (req, res) => {
  const body = parse(adSchema, req.body);
  const ad = await prisma.adBanner.create({ data: { ...body, endsAt: body.endsAt ? new Date(body.endsAt) : null } });
  res.status(201).json({ ad });
});

router.patch('/ads/:id', async (req, res) => {
  const body = parse(adSchema.partial(), req.body);
  const ad = await prisma.adBanner.update({
    where: { id: String(req.params.id) },
    data: { ...body, endsAt: body.endsAt === undefined ? undefined : body.endsAt ? new Date(body.endsAt) : null },
  });
  res.json({ ad });
});

router.delete('/ads/:id', async (req, res) => {
  await prisma.adBanner.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});

export default router;
