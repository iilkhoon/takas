import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Role, User } from '@prisma/client';
import { config } from './config';
import { prisma } from './db';
import { forbidden, unauthorized } from './http';

export const ACCESS_COOKIE = 'dy_at';
export const REFRESH_COOKIE = 'dy_rt';
export const LOGGED_IN_COOKIE = 'dy_li';
const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_DAYS = 30;

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function signAccess(user: Pick<User, 'id' | 'role'>) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: ACCESS_TTL_SEC });
}

export async function createSession(user: Pick<User, 'id' | 'role'>, userAgent?: string) {
  const raw = crypto.randomBytes(48).toString('base64url');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(raw),
      userAgent: userAgent?.slice(0, 250),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 864e5),
    },
  });
  return { accessToken: signAccess(user), refreshToken: raw };
}

const cookieBase = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax' as const,
  path: '/',
});

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...cookieBase(), maxAge: ACCESS_TTL_SEC * 1000 });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...cookieBase(), maxAge: REFRESH_TTL_DAYS * 864e5 });
  // Brauzer üçün "daxil olub" işarəsi (məxfi deyil) — qonaqlar üçün lazımsız /auth/me sorğularının qarşısını alır
  res.cookie(LOGGED_IN_COOKIE, '1', { ...cookieBase(), httpOnly: false, maxAge: REFRESH_TTL_DAYS * 864e5 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, cookieBase());
  res.clearCookie(REFRESH_COOKIE, cookieBase());
  res.clearCookie(LOGGED_IN_COOKIE, { ...cookieBase(), httpOnly: false });
}

function readToken(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return req.cookies?.[ACCESS_COOKIE];
}

/** Tokeni yoxlayır, uğurlu olarsa req.user təyin edir. Heç vaxt xəta atmır. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (token) {
    try {
      const p = jwt.verify(token, config.jwtSecret) as { sub: string; role: Role };
      req.user = { id: p.sub, role: p.role };
    } catch {
      /* vaxtı keçib — frontend refresh edəcək */
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

export const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};
