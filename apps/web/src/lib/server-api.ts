import 'server-only';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:4000';

/** Server komponentlərindən API çağırışı (istifadəçinin cookie-ləri ötürülür). */
export async function serverApi<T>(path: string, { revalidate = 0 }: { revalidate?: number } = {}): Promise<T | null> {
  // cookies() try-dan kənarda olmalıdır ki, Next.js səhifəni dinamik kimi tanısın
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error('serverApi failed', path, e);
    return null;
  }
}
