import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'منصة الخوارزمي | Al-Khwarizmi Platform',
  description: 'منصة إدارة مراكز التدريب وقدرات كمي ولفظي وتحصيلي',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'منصة الخوارزمي | Al-Khwarizmi Platform',
    description: 'منصة تدريب القدرات العامة والتحصيلي — بنك أسئلة، امتحانات محاكية، مكتبة محمية، ومتابعة لحظية لولي الأمر',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'منصة الخوارزمي',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'منصة الخوارزمي' }],
  },
  twitter: {
    card: 'summary',
    title: 'منصة الخوارزمي | Al-Khwarizmi Platform',
    description: 'منصة تدريب القدرات العامة والتحصيلي',
  },
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
    title: 'منصة الخوارزمي',
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
      <body><script dangerouslySetInnerHTML={{ __html: "(function(){try{if(window.localStorage.getItem('mkz-theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();" }} /><PWARegister /><Toaster position="top-left" toastOptions={{ style: { fontFamily: 'IBM Plex Sans Arabic, Cairo, sans-serif', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } }} />{children}</body>
    </html>
  );
}