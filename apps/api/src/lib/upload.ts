import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { config } from './config';
import { badRequest } from './http';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(badRequest('invalid_file_type'));
  },
});

/**
 * Şəkli emal edir: EXIF-ə görə döndərir, metadata-nı silir (məxfilik), WebP-yə çevirir.
 * Nəticə: tam ölçü (1600px) və miniatür (480px).
 * Gələcəkdə S3/Cloudflare R2-yə keçid üçün yalnız bu funksiyanı dəyişmək kifayətdir.
 */
export async function saveImage(buffer: Buffer, folder: 'listings' | 'avatars') {
  const now = new Date();
  const sub = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(config.uploadDir, sub);
  await fs.mkdir(dir, { recursive: true });
  const id = nanoid(16);
  const fullSize = folder === 'avatars' ? 512 : 1600;
  const thumbSize = folder === 'avatars' ? 160 : 480;

  let img;
  try {
    img = sharp(buffer, { failOn: 'none' }).rotate();
    await img.metadata();
  } catch {
    throw badRequest('invalid_image');
  }

  await img
    .clone()
    .resize(fullSize, fullSize, { fit: folder === 'avatars' ? 'cover' : 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, `${id}.webp`));
  await img
    .clone()
    .resize(thumbSize, thumbSize, { fit: 'cover' })
    .webp({ quality: 76 })
    .toFile(path.join(dir, `${id}_t.webp`));

  return { url: `/uploads/${sub}/${id}.webp`, thumbUrl: `/uploads/${sub}/${id}_t.webp` };
}

export async function deleteImage(url: string) {
  if (!url.startsWith('/uploads/')) return;
  const rel = url.replace('/uploads/', '');
  const p = path.join(config.uploadDir, rel);
  if (!p.startsWith(config.uploadDir)) return;
  await fs.unlink(p).catch(() => {});
}
