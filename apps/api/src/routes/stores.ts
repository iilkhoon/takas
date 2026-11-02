import { Router } from 'express';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { badRequest, conflict, notFound, pageParams, parse } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { imageUpload, saveImage, deleteImage } from '../lib/upload';
import { listingCard, listingCardInclude, publicUser, publicUserSelect } from '../lib/serialize';
import { CITY_SLUGS } from '../lib/cities';

const router = Router();
const suffix = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 4);

const TR: Record<string, string> = { ə: 'e', ş: 'sh', ç: 'ch', ğ: 'g', ı: 'i', ö: 'o', ü: 'u', і: 'i' };
const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya',
};

/** "Texno Dünya Bakı" → "texno-dunya-baki" */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .split('')
    .map((c) => TR[c] ?? CYR[c] ?? c)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const storeSelectPublic = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  logoUrl: true,
  coverColor: true,
  city: true,
  address: true,
  phone: true,
  instagram: true,
  website: true,
  hours: true,
  categories: true,
  verified: true,
  createdAt: true,
} satisfies Prisma.StoreSelect;

const slugRe = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

const storeSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => s === '' || slugRe.test(s), 'invalid_slug')
    .optional(),
  tagline: z.string().trim().max(120).default(''),
  description: z.string().trim().max(2000).default(''),
  city: z.enum(CITY_SLUGS as [string, ...string[]]).default('baku'),
  address: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(30).default(''),
  instagram: z
    .string()
    .trim()
    .max(60)
    .transform((s) => s.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, ''))
    .default(''),
  website: z.string().trim().max(200).refine((s) => s === '' || /^https?:\/\//.test(s), 'invalid_url').default(''),
  hours: z.string().trim().max(120).default(''),
  categories: z.array(z.string().max(60)).max(8).default([]),
  coverColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFDB1F'),
});

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = base || `magaza-${suffix()}`;
  if (slug.length < 3) slug = `${slug}-${suffix()}`;
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.store.findUnique({ where: { slug } });
    if (!taken || taken.id === exceptId) return slug;
    slug = `${base.slice(0, 34)}-${suffix()}`;
  }
  return `${base.slice(0, 30)}-${suffix()}${suffix()}`;
}

// ---------- İctimai ----------

router.get('/', async (req, res) => {
  const { skip, limit, page } = pageParams(req.query as Record<string, unknown>);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const city = typeof req.query.city === 'string' ? req.query.city : '';
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const where: Prisma.StoreWhereInput = {
    active: true,
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { tagline: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(city ? { city } : {}),
    ...(category ? { categories: { has: category } } : {}),
  };
  const [total, stores] = await Promise.all([
    prisma.store.count({ where }),
    prisma.store.findMany({
      where,
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      select: {
        ...storeSelectPublic,
        owner: {
          select: {
            ...publicUserSelect,
            _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
            listings: {
              where: { status: 'ACTIVE' },
              orderBy: { bumpedAt: 'desc' },
              take: 3,
              select: { id: true, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { thumbUrl: true } } },
            },
          },
        },
      },
    }),
  ]);
  res.json({
    items: stores.map(({ owner, ...s }) => {
      const { _count, listings, ...u } = owner;
      return {
        ...s,
        owner: publicUser(u),
        activeListings: _count.listings,
        preview: listings.map((l) => ({ id: l.id, thumbUrl: l.images[0]?.thumbUrl ?? null })),
      };
    }),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

router.get('/me/current', requireAuth, async (req, res) => {
  const store = await prisma.store.findUnique({ where: { ownerId: userId(req) } });
  res.json({ store });
});

router.post('/', requireAuth, async (req, res) => {
  const me = userId(req);
  const body = parse(storeSchema, req.body);
  const existing = await prisma.store.findUnique({ where: { ownerId: me } });
  if (existing) throw conflict('store_exists');
  if (body.slug) {
    const taken = await prisma.store.findUnique({ where: { slug: body.slug } });
    if (taken) throw conflict('slug_taken');
  }
  const slug = body.slug || (await uniqueSlug(slugify(body.name)));
  const store = await prisma.store.create({ data: { ...body, slug, ownerId: me } });
  await prisma.notification.create({ data: { userId: me, type: 'store_created', data: { name: store.name, slug: store.slug } } });
  res.status(201).json({ store });
});

router.patch('/me', requireAuth, async (req, res) => {
  const me = userId(req);
  const current = await prisma.store.findUnique({ where: { ownerId: me } });
  if (!current) throw notFound();
  const body = parse(storeSchema.partial(), req.body);
  if (body.slug && body.slug !== current.slug) {
    const taken = await prisma.store.findUnique({ where: { slug: body.slug } });
    if (taken) throw conflict('slug_taken');
  }
  // Ad dəyişəndə "təsdiqlənmiş" nişanı yenidən yoxlanılmalıdır
  const renamed = body.name && body.name !== current.name;
  const store = await prisma.store.update({
    where: { id: current.id },
    data: { ...body, slug: body.slug || current.slug, verified: renamed ? false : current.verified, active: true },
  });
  res.json({ store });
});

router.post('/me/logo', requireAuth, imageUpload.single('file'), async (req, res) => {
  const me = userId(req);
  const current = await prisma.store.findUnique({ where: { ownerId: me } });
  if (!current) throw notFound();
  if (!req.file) throw badRequest('no_file');
  const { url } = await saveImage(req.file.buffer, 'avatars');
  const store = await prisma.store.update({ where: { id: current.id }, data: { logoUrl: url } });
  if (current.logoUrl) await deleteImage(current.logoUrl);
  res.json({ store });
});

/** Mağazanı bağla — elanlar adi istifadəçi elanı kimi qalır */
router.delete('/me', requireAuth, async (req, res) => {
  const me = userId(req);
  await prisma.store.updateMany({ where: { ownerId: me }, data: { active: false } });
  res.json({ ok: true });
});

router.get('/:slug', async (req, res) => {
  const store = await prisma.store.findUnique({
    where: { slug: String(req.params.slug) },
    select: { ...storeSelectPublic, active: true, ownerId: true, owner: { select: { ...publicUserSelect, isBanned: true } } },
  });
  if (!store || !store.active || store.owner.isBanned) throw notFound();
  const [listings, reviews, traded] = await Promise.all([
    prisma.listing.findMany({ where: { ownerId: store.ownerId, status: 'ACTIVE' }, orderBy: [{ vipUntil: 'desc' }, { bumpedAt: 'desc' }], include: listingCardInclude, take: 96 }),
    prisma.review.findMany({
      where: { targetId: store.ownerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.listing.count({ where: { ownerId: store.ownerId, status: 'TRADED' } }),
  ]);
  let favs = new Set<string>();
  if (req.user) {
    const f = await prisma.favorite.findMany({ where: { userId: req.user.id, listingId: { in: listings.map((l) => l.id) } } });
    favs = new Set(f.map((x) => x.listingId));
  }
  const { owner, active: _a, ownerId: _o, ...pub } = store;
  const { isBanned: _b, ...ownerPub } = owner;
  res.json({
    store: { ...pub, tradedItems: traded },
    owner: publicUser(ownerPub),
    listings: listings.map((l) => listingCard(l, favs)),
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, author: r.author })),
  });
});

export default router;
