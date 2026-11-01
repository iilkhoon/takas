import 'dotenv/config';
import path from 'path';

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  isProd: process.env.NODE_ENV === 'production',
  webUrl: req('PUBLIC_WEB_URL', 'http://localhost:3000'),
  apiUrl: req('PUBLIC_API_URL', 'http://localhost:4000'),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
  jwtSecret: req('JWT_SECRET', 'dev-access-secret'),
  refreshSecret: req('REFRESH_SECRET', 'dev-refresh-secret'),
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './uploads'),
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? 'mock') as 'mock' | 'epoint',
  epoint: {
    publicKey: process.env.EPOINT_PUBLIC_KEY ?? '',
    privateKey: process.env.EPOINT_PRIVATE_KEY ?? '',
  },
};

/**
 * Monetizasiya qaydaları — bir yerdən idarə olunur.
 * Qiymətlər qəpiklə (100 = 1 AZN).
 */
export const pricing = {
  /** Pulsuz planda eyni anda aktiv elan limiti */
  freeActiveListings: 5,
  /** Plus planda limit */
  plusActiveListings: 100,
  /** "İrəli çək" — elanı siyahının başına qaldırır */
  bump: 100,
  /** VIP — 7 gün ərzində VIP blokda və axtarışda yuxarıda */
  vip7: 390,
  vipDays: 7,
  /** Dəyiş Plus aylıq abunə */
  plusMonthly: 990,
  /** Plus abunəçilərinə hər ay verilən pulsuz irəli çəkmə sayı */
  plusMonthlyBoosts: 5,
  /** Sadiqlik: hər N tamamlanmış takasdan sonra 1 pulsuz irəli çəkmə ("6-cı pulsuz") */
  loyaltyEvery: 5,
  /** Dəvət bonusu: dəvət olunan ilk elanını yerləşdirəndə hər iki tərəfə */
  referralBoosts: 2,
  /** Yeni qeydiyyat bonusu */
  welcomeBoosts: 1,
  /** Balans artırma paketləri */
  topupPacks: [500, 1000, 2000, 5000],
};
