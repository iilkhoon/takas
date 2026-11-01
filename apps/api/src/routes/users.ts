import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { notFound, parse, conflict } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { imageUpload, saveImage, deleteImage } from '../lib/upload';
import { listingCard, listingCardInclude, publicUser, publicUserSelect, selfUser } from '../lib/serialize';
import { CITY_SLUGS } from '../lib/cities';

const router = Router();

const phoneRe = /^\+994(10|50|51|55|60|70|77|99)\d{7}$/;

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(400).optional(),
  city: z.enum(CITY_SLUGS as [string, ...string[]]).optional(),
  locale: z.enum(['az', 'en', 'tr', 'ru']).optional(),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s()-]/g, ''))
    .refine((s) => s === '' || phoneRe.test(s), 'invalid_phone')
    .optional(),
});

router.patch('/me', requireAuth, async (req, res) => {
  const me = userId(req);
  const body = parse(updateSchema, req.body);
  const current = await prisma.user.findUniqueOrThrow({ where: { id: me } });
  const data: Record<string, unknown> = { ...body };
  if (body.phone !== undefined) {
    const phone = body.phone || null;
    if (phone && phone !== current.phone) {
      const taken = await prisma.user.findUnique({ where: { phone } });
      if (taken) throw conflict('phone_taken');
    }
    data.phone = phone;
    if (phone !== current.phone) data.phoneVerified = false;
  }
  const user = await prisma.user.update({ where: { id: me }, data });
  res.json({ user: selfUser(user) });
});

router.post('/me/avatar', requireAuth, imageUpload.single('file'), async (req, res) => {
  const me = userId(req);
  if (!req.file) throw notFound('no_file');
  const { url } = await saveImage(req.file.buffer, 'avatars');
  const prev = await prisma.user.findUniqueOrThrow({ where: { id: me } });
  const user = await prisma.user.update({ where: { id: me }, data: { avatarUrl: url } });
  if (prev.avatarUrl) await deleteImage(prev.avatarUrl);
  res.json({ user: selfUser(user) });
});

router.get('/me/favorites', requireAuth, async (req, res) => {
  const me = userId(req);
  const favs = await prisma.favorite.findMany({
    where: { userId: me },
    orderBy: { createdAt: 'desc' },
    include: { listing: { include: listingCardInclude } },
  });
  const set = new Set(favs.map((f) => f.listingId));
  res.json({ items: favs.map((f) => listingCard(f.listing, set)) });
});

router.get('/me/referrals', requireAuth, async (req, res) => {
  const me = userId(req);
  const refs = await prisma.user.findMany({
    where: { referredById: me },
    select: { id: true, name: true, createdAt: true, referralRewarded: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: refs });
});

router.get('/:id', async (req, res) => {
  const id = String(req.params.id);
  const u = await prisma.user.findUnique({ where: { id }, select: { ...publicUserSelect, bio: true, isBanned: true } });
  if (!u || u.isBanned) throw notFound();
  const [listings, reviews, traded] = await Promise.all([
    prisma.listing.findMany({ where: { ownerId: id, status: 'ACTIVE' }, orderBy: { bumpedAt: 'desc' }, include: listingCardInclude, take: 60 }),
    prisma.review.findMany({
      where: { targetId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.listing.count({ where: { ownerId: id, status: 'TRADED' } }),
  ]);
  let favs = new Set<string>();
  if (req.user) {
    const f = await prisma.favorite.findMany({ where: { userId: req.user.id, listingId: { in: listings.map((l) => l.id) } } });
    favs = new Set(f.map((x) => x.listingId));
  }
  const { isBanned: _b, ...rest } = u;
  res.json({
    user: { ...publicUser(rest), bio: u.bio, tradedItems: traded },
    listings: listings.map((l) => listingCard(l, favs)),
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, author: r.author })),
  });
});

export default router;
