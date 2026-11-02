import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dəyiş — Azərbaycanın takas platforması',
    short_name: 'Dəyiş',
    description: 'Lazımsızını dəyiş, lazımlını tap!',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF7E8',
    theme_color: '#FFDB1F',
    icons: [{ src: '/brand/mark.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
