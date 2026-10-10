import type { Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';

export const metadata = {
  title: 'سنتر الخوارزمي | Al-Khwarizmi Center',
  description: 'منصة إدارة مراكز التدريب',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'سنتر الخوارزمي',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body><script dangerouslySetInnerHTML={{ __html: "(function(){try{if(window.localStorage.getItem('mkz-theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();" }} /><PWARegister />{children}</body>
    </html>
  );
}