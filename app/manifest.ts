import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منصة الخوارزمي — Al-Khwarizmi Platform',
    short_name: 'منصة الخوارزمي',
    description: 'منصة الخوارزمي لتدريب القدرات العامة والتحصيلي — كورسات، مكتبة محتوى محمية، وامتحانات محاكية',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f17',
    theme_color: '#0b0f17',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}