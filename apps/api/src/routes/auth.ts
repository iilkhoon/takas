import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { config, pricing } from '../lib/config';
import { badRequest, conflict, parse, unauthorized } from '../lib/http';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  createSession,
  requireAuth,
  setAuthCookies,
  sha256,
  signAccess,
  userId,
} from '../lib/auth';
import { selfUser } from '../lib/serialize';
import { notify } from '../lib/notify';

const router = Router();
const refCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 7);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProd ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

const phoneRe = /^\+994(10|50|51|55|60|70|77|99)\d{7}$/;

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s()-]/g, ''))
    .refine((s) => s === '' || phoneRe.test(s), 'invalid_phone')
    .optional(),
  password: z.string().min(8).max(100),
  city: z.string().trim().min(2).max(40).default('baku'),
  locale: z.enum(['az', 'en', 'tr', 'ru']).default('az'),
  referralCode: z.string().trim().toUpperCase().max(12).optional(),
});

router.post('/register', authLimiter, async (req, res) => {
  const body = parse(registerSchema, req.body);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw conflict('email_taken');
  if (body.phone) {
    const phoneTaken = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (phoneTaken) throw conflict('phone_taken');
  }
  let referredById: string | undefined;
  if (body.referralCode) {
    const ref = await prisma.user.findUnique({ where: { referralCode: body.referralCode } });
    if (ref) referredById = ref.id;
  }
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      passwordHash: await bcrypt.hash(body.password, 11),
      city: body.city,
      locale: body.locale,
      referralCode: refCode(),
      referredById,
      boostCredits: pricing.welcomeBoosts,
    },
  });
  await notify(user.id, 'welcome', { boosts: pricing.welcomeBoosts });
  const tokens = await createSession(user, req.headers['user-agent']);
  setAuthCookies(res, tokens);
  res.status(201).json({ user: selfUser(user), ...tokens });
});

const loginSchema = z.object({
  login: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(100),
});

router.post('/login', authLimiter, async (req, res) => {
  const { login, password } = parse(loginSchema, req.body);
  const normalized = login.toLowerCase();
  const phone = login.replace(/[\s()-]/g, '');
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { phone }] },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw unauthorized('invalid_credentials');
  if (user.isBanned) throw unauthorized('account_banned');
  const tokens = await createSession(user, req.headers['user-agent']);
  setAuthCookies(res, tokens);
  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  res.json({ user: selfUser(user), ...tokens });
});

router.post('/refresh', async (req, res) => {
  const raw: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (!raw) throw unauthorized('no_refresh_token');
  const session = await prisma.session.findUnique({ where: { tokenHash: sha256(raw) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.isBanned) {
    clearAuthCookies(res);
    throw unauthorized('invalid_refresh_token');
  }
  // Rotasiya: köhnə sessiyanı silib yenisini yaradırıq
  await prisma.session.delete({ where: { id: session.id } });
  const tokens = await createSession(session.user, req.headers['user-agent']);
  setAuthCookies(res, tokens);
  await prisma.user.update({ where: { id: session.userId }, data: { lastSeenAt: new Date() } });
  res.json({ user: selfUser(session.user), ...tokens });
});

router.post('/logout', async (req, res) => {
  const raw: string | undefined = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (raw) await prisma.session.deleteMany({ where: { tokenHash: sha256(raw) } });
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: userId(req) } });
  if (!user) throw unauthorized();
  const [unreadNotifications, unreadMessages, pendingOffers] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: user.id },
        conversation: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      },
    }),
    prisma.offer.count({ where: { toUserId: user.id, status: 'PENDING' } }),
  ]);
  res.json({ user: selfUser(user), counters: { unreadNotifications, unreadMessages, pendingOffers } });
});

const passwordSchema = z.object({ current: z.string().min(1), next: z.string().min(8).max(100) });

router.post('/change-password', requireAuth, async (req, res) => {
  const body = parse(passwordSchema, req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
  if (!(await bcrypt.compare(body.current, user.passwordHash))) throw badRequest('wrong_password');
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.next, 11) } });
  // Bütün digər sessiyalardan çıxış
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const tokens = await createSession(user, req.headers['user-agent']);
  setAuthCookies(res, tokens);
  res.json({ ok: true });
});

/**
 * SMS ilə telefon təsdiqi — gələcəkdə yerli SMS provayderi (məs. LSIM, Azercell Biznes) qoşulacaq.
 * Development rejimində kod həmişə 111111-dir.
 */
const pendingOtps = new Map<string, { code: string; exp: number }>();

router.post('/phone/send-code', requireAuth, authLimiter, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
  if (!user.phone) throw badRequest('no_phone');
  const code = config.isProd ? String(Math.floor(100000 + Math.random() * 900000)) : '111111';
  pendingOtps.set(user.id, { code, exp: Date.now() + 5 * 60 * 1000 });
  // TODO: SMS provayderinə göndər
  res.json({ ok: true, devHint: config.isProd ? undefined : code });
});

router.post('/phone/verify', requireAuth, async (req, res) => {
  const { code } = parse(z.object({ code: z.string().length(6) }), req.body);
  const id = userId(req);
  const p = pendingOtps.get(id);
  if (!p || p.exp < Date.now() || p.code !== code) throw badRequest('invalid_code');
  pendingOtps.delete(id);
  const user = await prisma.user.update({ where: { id }, data: { phoneVerified: true } });
  res.json({ user: selfUser(user) });
});

export { signAccess };
export default router;
