import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dəyiş — Azərbaycanın takas platforması',
    short_name: 'Dəyiş',
    description: 'Lazımsızını dəyiş, lazımlını tap!',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8F1',
    theme_color: '#E8334A',
    icons: [{ src: '/brand/mark.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
