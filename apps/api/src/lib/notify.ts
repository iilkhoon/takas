import { prisma } from './db';

export type NotificationType =
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_countered'
  | 'offer_cancelled'
  | 'trade_completed'
  | 'confirm_requested'
  | 'review_received'
  | 'message'
  | 'listing_favorited'
  | 'loyalty_reward'
  | 'referral_reward'
  | 'listing_rejected'
  | 'welcome'
  | 'match_found'
  | 'store_created'
  | 'store_verified';

export async function notify(userId: string, type: NotificationType, data: Record<string, unknown> = {}) {
  try {
    await prisma.notification.create({ data: { userId, type, data: data as object } });
  } catch (e) {
    console.error('notify failed', e);
  }
}
