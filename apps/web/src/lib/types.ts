export type Locale = 'az' | 'en' | 'tr' | 'ru';
export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'FOR_PARTS';
export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'TRADED' | 'ARCHIVED' | 'PENDING_REVIEW' | 'REJECTED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COUNTERED' | 'COMPLETED';
export type SwapType = 'ANY' | 'EVEN' | 'PAY_EXTRA' | 'WANT_EXTRA';
export type Level = 'newbie' | 'starter' | 'trader' | 'master' | 'legend';

export interface Category {
  id: string;
  slug: string;
  icon: string;
  color: string;
  name: Record<Locale, string>;
  count?: number;
}

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string;
  plan: 'FREE' | 'PLUS';
  phoneVerified: boolean;
  completedTrades: number;
  rating: number | null;
  ratingCount: number;
  level: Level;
  createdAt: string;
  lastSeenAt: string;
  bio?: string | null;
  activeListings?: number;
  tradedItems?: number;
  store: StoreTagInfo | null;
}

export interface StoreTagInfo {
  slug: string;
  name: string;
  logoUrl?: string | null;
  verified: boolean;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverColor: string;
  city: string;
  address: string;
  phone: string;
  instagram: string;
  website: string;
  hours: string;
  categories: string[];
  verified: boolean;
  createdAt: string;
  active?: boolean;
  tradedItems?: number;
}

export interface Me {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string;
  locale: Locale;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  plan: 'FREE' | 'PLUS';
  planUntil: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  balance: number;
  boostCredits: number;
  completedTrades: number;
  rating: number | null;
  ratingCount: number;
  level: Level;
  referralCode: string;
  createdAt: string;
  store?: StoreTagInfo | null;
}

export interface Image {
  id?: string;
  url: string;
  thumbUrl: string;
}

export interface ListingCard {
  id: string;
  title: string;
  condition: Condition;
  estimatedValue: number;
  city: string;
  wantedText: string;
  wantedCategories: string[];
  acceptsCash: boolean;
  swapType: SwapType;
  extraCash: number;
  openToAnything: boolean;
  canShip: boolean;
  status: ListingStatus;
  views: number;
  isVip: boolean;
  vipUntil: string | null;
  bumpedAt: string;
  createdAt: string;
  image: Image | null;
  category: Category;
  owner: PublicUser;
  favorites: number;
  offers: number;
  isFavorite: boolean;
}

export interface ListingDetail extends Omit<ListingCard, 'wantedCategories' | 'image'> {
  description: string;
  images: Image[];
  wantedCategories: Category[];
  isOwner: boolean;
  myPendingOffer: { id: string; status: OfferStatus } | null;
}

export interface Offer {
  id: string;
  status: OfferStatus;
  cashAmount: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  parentOfferId: string | null;
  conversationId: string | null;
  proposerId: string;
  fromConfirmed: boolean;
  toConfirmed: boolean;
  listing: ListingCard;
  items: ListingCard[];
  fromUser: PublicUser;
  toUser: PublicUser;
  role: 'sender' | 'receiver';
  myTurn: boolean;
  myConfirmed: boolean;
  reviewed: boolean;
  fairness: { targetValue: number; offeredValue: number; ratio: number };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: 'TEXT' | 'SYSTEM' | 'OFFER';
  body: string;
  offerId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  other: PublicUser;
  listing: { id: string; title: string; status: ListingStatus; image: Image | null } | null;
  lastMessage: Message | null;
  lastMessageAt: string;
  unread: number;
}

export interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface Pricing {
  freeActiveListings: number;
  plusActiveListings: number;
  bump: number;
  vip7: number;
  vipDays: number;
  plusMonthly: number;
  plusMonthlyBoosts: number;
  storeActiveListings: number;
  loyaltyEvery: number;
  referralBoosts: number;
  welcomeBoosts: number;
  topupPacks: number[];
}

export interface Meta {
  categories: Category[];
  cities: string[];
  pricing: Pricing;
  payments: { provider: string };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
