import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string, public details?: unknown) {
    super(message ?? code);
  }
}

export const badRequest = (code: string, details?: unknown) => new HttpError(400, code, code, details);
export const unauthorized = (code = 'unauthorized') => new HttpError(401, code);
export const forbidden = (code = 'forbidden') => new HttpError(403, code);
export const notFound = (code = 'not_found') => new HttpError(404, code);
export const conflict = (code: string) => new HttpError(409, code);
export const paymentRequired = (code: string, details?: unknown) => new HttpError(402, code, code, details);

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'validation_error', 'validation_error', r.error.flatten());
  return r.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_error', details: err.flatten() });
  }
  const anyErr = err as { code?: string; message?: string; type?: string };
  if (anyErr?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large' });
  if (anyErr?.type === 'entity.too.large') return res.status(413).json({ error: 'payload_too_large' });
  console.error(err);
  return res.status(500).json({ error: 'server_error' });
}

export function pageParams(q: Record<string, unknown>, maxLimit = 48) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(q.limit) || 24));
  return { page, limit, skip: (page - 1) * limit };
}
