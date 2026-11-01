import crypto from 'crypto';
import { config } from './config';

/**
 * Ödəniş provayderi interfeysi.
 * - mock: test üçün, ödəniş dərhal uğurlu sayılır (yalnız development).
 * - epoint: Azərbaycanda lisenziyalı ödəniş şlüzü (epoint.az). Canlıya çıxmazdan əvvəl
 *   Epoint ilə müqavilə bağlanmalı və sənədləşmə (https://epoint.az/az/api-docs) yoxlanmalıdır.
 *   Kapital Bank, Payriff və s. eyni interfeysə əlavə edilə bilər.
 */
export interface CheckoutResult {
  redirectUrl: string;
  providerRef: string;
}

export interface PaymentProvider {
  name: string;
  createCheckout(input: { orderId: string; amountQepik: number; description: string; locale: string }): Promise<CheckoutResult>;
  /** Callback-i yoxlayır; uğurlu olarsa sifariş id-sini qaytarır */
  verifyCallback(body: Record<string, string>): { orderId: string; success: boolean; providerRef?: string } | null;
}

const mockProvider: PaymentProvider = {
  name: 'mock',
  async createCheckout({ orderId }) {
    return {
      redirectUrl: `${config.webUrl}/wallet?mockPay=${orderId}`,
      providerRef: `mock_${orderId}`,
    };
  },
  verifyCallback(body) {
    if (!body.order_id) return null;
    return { orderId: body.order_id, success: body.status !== 'failed', providerRef: `mock_${body.order_id}` };
  },
};

function epointSign(data: string) {
  const { privateKey } = config.epoint;
  return crypto.createHash('sha1').update(privateKey + data + privateKey).digest('base64');
}

const epointProvider: PaymentProvider = {
  name: 'epoint',
  async createCheckout({ orderId, amountQepik, description, locale }) {
    const payload = {
      public_key: config.epoint.publicKey,
      amount: (amountQepik / 100).toFixed(2),
      currency: 'AZN',
      language: ['az', 'en', 'ru'].includes(locale) ? locale : 'az',
      order_id: orderId,
      description,
      success_redirect_url: `${config.webUrl}/wallet?paid=1`,
      error_redirect_url: `${config.webUrl}/wallet?paid=0`,
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = epointSign(data);
    const res = await fetch('https://epoint.az/api/1/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data, signature }),
    });
    const json = (await res.json()) as { status?: string; redirect_url?: string; transaction?: string };
    if (json.status !== 'success' || !json.redirect_url) throw new Error('epoint_checkout_failed');
    return { redirectUrl: json.redirect_url, providerRef: json.transaction ?? orderId };
  },
  verifyCallback(body) {
    const { data, signature } = body;
    if (!data || !signature || epointSign(data) !== signature) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as {
      order_id: string;
      status: string;
      transaction?: string;
    };
    return { orderId: parsed.order_id, success: parsed.status === 'success', providerRef: parsed.transaction };
  },
};

export function paymentProvider(): PaymentProvider {
  return config.paymentProvider === 'epoint' ? epointProvider : mockProvider;
}
