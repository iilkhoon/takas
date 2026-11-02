import type { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  city: true,
  plan: true,
  phoneVerified: true,
  completedTrades: true,
  ratingSum: true,
  ratingCount: true,
  createdAt: true,
  lastSeenAt: true,
  store: { select: { slug: true, name: true, logoUrl: true, verified: true, active: true } },
} satisfies Prisma.UserSelect;

export type PublicUserRow = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export function publicUser(u: PublicUserRow) {
  const { ratingSum, ratingCount, store, ...rest } = u;
  return {
    ...rest,
    store: store && store.active ? { slug: store.slug, name: store.name, logoUrl: store.logoUrl, verified: store.verified } : null,
    rating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    ratingCount,
    level: tradeLevel(u.completedTrades),
  };
}

/** Oyunlaşdırma: takas sayına görə səviyyə */
export function tradeLevel(trades: number) {
  if (trades >= 50) return 'legend';
  if (trades >= 20) return 'master';
  if (trades >= 5) return 'trader';
  if (trades >= 1) return 'starter';
  return 'newbie';
}

export const listingCardInclude = {
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
  category: true,
  owner: { select: publicUserSelect },
  _count: { select: { favorites: true, offersTargeting: true } },
} satisfies Prisma.ListingInclude;

export type ListingCardRow = Prisma.ListingGetPayload<{ include: typeof listingCardInclude }>;

export function listingCard(l: ListingCardRow, favIds?: Set<string>) {
  return {
    id: l.id,
    title: l.title,
    condition: l.condition,
    estimatedValue: l.estimatedValue,
    city: l.city,
    wantedText: l.wantedText,
    wantedCategories: l.wantedCategories,
    acceptsCash: l.acceptsCash,
    swapType: l.swapType,
    extraCash: l.extraCash,
    openToAnything: l.openToAnything,
    canShip: l.canShip,
    status: l.status,
    views: l.views,
    isVip: !!l.vipUntil && l.vipUntil > new Date(),
    vipUntil: l.vipUntil,
    bumpedAt: l.bumpedAt,
    createdAt: l.createdAt,
    image: l.images[0] ?? null,
    category: category(l.category),
    owner: publicUser(l.owner),
    favorites: l._count.favorites,
    offers: l._count.offersTargeting,
    isFavorite: favIds ? favIds.has(l.id) : false,
  };
}

export function category(c: {
  id: string;
  slug: string;
  icon: string;
  color: string;
  nameAz: string;
  nameEn: string;
  nameTr: string;
  nameRu: string;
}) {
  return {
    id: c.id,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    name: { az: c.nameAz, en: c.nameEn, tr: c.nameTr, ru: c.nameRu },
  };
}

export function selfUser(u: Prisma.UserGetPayload<object>) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    city: u.city,
    locale: u.locale,
    role: u.role,
    plan: u.plan,
    planUntil: u.planUntil,
    phoneVerified: u.phoneVerified,
    emailVerified: u.emailVerified,
    balance: u.balance,
    boostCredits: u.boostCredits,
    completedTrades: u.completedTrades,
    rating: u.ratingCount ? Math.round((u.ratingSum / u.ratingCount) * 10) / 10 : null,
    ratingCount: u.ratingCount,
    level: tradeLevel(u.completedTrades),
    referralCode: u.referralCode,
    createdAt: u.createdAt,
  };
}
