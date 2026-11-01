'use client';

export class ApiError extends Error {
  constructor(public status: number, public code: string, public details?: unknown) {
    super(code);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => (refreshing = null), 100);
      });
  }
  return refreshing;
}

type Opts = Omit<RequestInit, 'body'> & { body?: unknown; retry?: boolean };

/** Brauzerdən API-yə müraciət. 401 olarsa tokeni avtomatik yeniləyir. */
export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const { body, retry = true, headers, ...rest } = opts;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    ...rest,
    headers: { ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 401 && retry && !path.startsWith('/auth/refresh') && !path.startsWith('/auth/login')) {
    if (await refresh()) return api<T>(path, { ...opts, retry: false });
  }
  if (!res.ok) {
    let data: { error?: string; details?: unknown } = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, data.error ?? 'server_error', data.details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const fetcher = <T,>(path: string) => api<T>(path);
