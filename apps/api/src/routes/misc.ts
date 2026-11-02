import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { config, pricing } from '../lib/config';
import { badRequest, notFound, parse } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { imageUpload, saveImage } from '../lib/upload';
import { category } from '../lib/serialize';
import { CITY_SLUGS } from '../lib/cities';

const router = Router();

// ---------- Meta ----------
router.get('/meta', async (_req, res) => {
  const cats = await prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: 'asc' } });
  const counts = await prisma.listing.groupBy({ by: ['categoryId'], where: { status: 'ACTIVE' }, _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    categories: cats.map((c) => ({ ...category(c), count: countMap.get(c.id) ?? 0 })),
    cities: CITY_SLUGS,
    pricing: {
      freeActiveListings: pricing.freeActiveListings,
      plusActiveListings: pricing.plusActiveListings,
      bump: pricing.bump,
      vip7: pricing.vip7,
      vipDays: pricing.vipDays,
      plusMonthly: pricing.plusMonthly,
      plusMonthlyBoosts: pricing.plusMonthlyBoosts,
      storeActiveListings: pricing.storeActiveListings,
      loyaltyEvery: pricing.loyaltyEvery,
      referralBoosts: pricing.referralBoosts,
      welcomeBoosts: pricing.welcomeBoosts,
      topupPacks: pricing.topupPacks,
    },
    payments: { provider: config.paymentProvider },
  });
});

// ---------- Şəkil yükləmə ----------
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.isProd ? 80 : 2000,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  message: { error: 'too_many_requests' },
});

router.post('/uploads/images', requireAuth, uploadLimiter, imageUpload.array('files', 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw badRequest('no_files');
  const saved = [];
  for (const f of files) saved.push(await saveImage(f.buffer, 'listings'));
  res.status(201).json({ images: saved });
});

// ---------- Bildirişlər ----------
router.get('/notifications', requireAuth, async (req, res) => {
  const me = userId(req);
  const items = await prisma.notification.findMany({ where: { userId: me }, orderBy: { createdAt: 'desc' }, take: 60 });
  res.json({ items });
});

router.post('/notifications/read', requireAuth, async (req, res) => {
  const me = userId(req);
  const { ids } = parse(z.object({ ids: z.array(z.string()).optional() }), req.body ?? {});
  await prisma.notification.updateMany({
    where: { userId: me, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

// ---------- Şikayətlər ----------
const reportSchema = z.object({
  listingId: z.string().optional(),
  userId: z.string().optional(),
  reason: z.enum(['scam', 'prohibited', 'wrong_category', 'duplicate', 'offensive', 'other']),
  details: z.string().trim().max(1000).default(''),
});

router.post('/reports', requireAuth, async (req, res) => {
  const body = parse(reportSchema, req.body);
  if (!body.listingId && !body.userId) throw badRequest('missing_target');
  if (body.listingId && !(await prisma.listing.findUnique({ where: { id: body.listingId } }))) throw notFound();
  await prisma.report.create({ data: { ...body, reporterId: userId(req) } });
  res.status(201).json({ ok: true });
});

// ---------- Reklam bannerləri ----------
router.get('/ads', async (req, res) => {
  const placement = String(req.query.placement ?? '');
  const now = new Date();
  const ads = await prisma.adBanner.findMany({
    where: { placement, active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    take: 5,
  });
  if (!ads.length) return res.json({ ad: null });
  const ad = ads[Math.floor(Math.random() * ads.length)];
  await prisma.adBanner.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } });
  res.json({ ad: { id: ad.id, title: ad.title, imageUrl: ad.imageUrl, advertiser: ad.advertiser } });
});

router.get('/ads/:id/click', async (req, res) => {
  const ad = await prisma.adBanner.findUnique({ where: { id: String(req.params.id) } });
  if (!ad) throw notFound();
  await prisma.adBanner.update({ where: { id: ad.id }, data: { clicks: { increment: 1 } } });
  res.redirect(302, ad.linkUrl);
});

export default router;
