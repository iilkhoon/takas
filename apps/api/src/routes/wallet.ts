import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { config, pricing } from '../lib/config';
import { badRequest, forbidden, parse, paymentRequired } from '../lib/http';
import { requireAuth, userId } from '../lib/auth';
import { paymentProvider } from '../lib/payments';
import { selfUser } from '../lib/serialize';
import { notify } from '../lib/notify';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const me = userId(req);
  const [user, txs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: me } }),
    prisma.transaction.findMany({ where: { userId: me }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  const every = pricing.loyaltyEvery;
  res.json({
    user: selfUser(user),
    transactions: txs,
    loyalty: {
      every,
      progress: user.completedTrades % every,
      remaining: every - (user.completedTrades % every),
    },
  });
});

async function creditTopup(orderId: string, providerRef?: string) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id: orderId } });
    if (!t || t.type !== 'TOPUP' || t.status !== 'PENDING') return null; // idempotent
    await tx.transaction.update({ where: { id: t.id }, data: { status: 'SUCCESS', providerRef: providerRef ?? t.providerRef } });
    await tx.user.update({ where: { id: t.userId }, data: { balance: { increment: t.amount } } });
    return t;
  });
}

router.post('/topup', requireAuth, async (req, res) => {
  const me = userId(req);
  const { amount } = parse(z.object({ amount: z.number().int().min(100).max(100000) }), req.body);
  const provider = paymentProvider();
  const tx = await prisma.transaction.create({
    data: { userId: me, type: 'TOPUP', status: 'PENDING', amount, provider: provider.name },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me } });
  try {
    const checkout = await provider.createCheckout({
      orderId: tx.id,
      amountQepik: amount,
      description: `Dəyiş balans artırılması ${(amount / 100).toFixed(2)} AZN`,
      locale: user.locale,
    });
    await prisma.transaction.update({ where: { id: tx.id }, data: { providerRef: checkout.providerRef } });
    res.json({ orderId: tx.id, redirectUrl: checkout.redirectUrl });
  } catch (e) {
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: 'FAILED' } });
    throw e;
  }
});

/** Yalnız test rejimi: mock ödənişi tamamla */
router.post('/mock-complete', requireAuth, async (req, res) => {
  if (config.paymentProvider !== 'mock' || config.isProd) throw forbidden('mock_disabled');
  const { orderId } = parse(z.object({ orderId: z.string() }), req.body);
  const t = await prisma.transaction.findUnique({ where: { id: orderId } });
  if (!t || t.userId !== userId(req)) throw badRequest('invalid_order');
  await creditTopup(orderId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: t.userId } });
  res.json({ user: selfUser(user) });
});

/** Ödəniş şlüzünün server-server callback-i */
router.post('/callback/:provider', async (req, res) => {
  const provider = paymentProvider();
  if (req.params.provider !== provider.name || provider.name === 'mock') throw forbidden();
  const result = provider.verifyCallback(req.body as Record<string, string>);
  if (!result) throw badRequest('invalid_signature');
  if (result.success) await creditTopup(result.orderId, result.providerRef);
  else await prisma.transaction.updateMany({ where: { id: result.orderId, status: 'PENDING' }, data: { status: 'FAILED' } });
  res.json({ ok: true });
});

/** Dəyiş Plus abunəliyi (balansdan, 30 gün) */
router.post('/plus', requireAuth, async (req, res) => {
  const me = userId(req);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: me } });
    if (u.balance < pricing.plusMonthly) throw paymentRequired('insufficient_balance', { need: pricing.plusMonthly, balance: u.balance });
    const from = u.plan === 'PLUS' && u.planUntil && u.planUntil > new Date() ? u.planUntil : new Date();
    await tx.transaction.create({ data: { userId: me, type: 'PLUS', status: 'SUCCESS', amount: -pricing.plusMonthly, meta: { days: 30 } } });
    return tx.user.update({
      where: { id: me },
      data: {
        plan: 'PLUS',
        planUntil: new Date(from.getTime() + 30 * 864e5),
        balance: { decrement: pricing.plusMonthly },
        boostCredits: { increment: pricing.plusMonthlyBoosts },
      },
    });
  });
  await notify(me, 'welcome', { plus: true });
  res.json({ user: selfUser(user) });
});

export default router;
