import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import { Toaster } from 'react-hot-toast';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://markazak-saas.vercel.app';

export const metadata: Metadata = {
  title: 'منصة الخوارزمي | منظومة تدريب القدرات والتحصيلي السحابية (SaaS) وإدارة مراكز التدريب',
  description: 'المنظومة السحابية المتكاملة لتدريب القدرات العامة والتحصيلي: بوابة الطالب التنافسية الذكية (بطاقات لايتنر، تحديات 1v1، توقعات المعدل)، بنك أسئلة ذكي، امتحانات محاكية لقياس، مكتبة فيديو محمية، ومتابعة فورية لأولياء الأمور.',
  metadataBase: new URL(SITE_URL),
  keywords: [
    'منصة الخوارزمي',
    'تدريب قدرات وتحصيلي',
    'محاكي قياس سحابي',
    'قدرات كمي ولفظي',
    'بنك أسئلة قياس',
    'تجميعات قدرات 120',
    'برنامج إدارة مراكز التدريب',
    'بطاقات لايتنر قدرات',
    'تحدي قدرات 1v1',
    'مكتبة دورات قدرات محمية',
    'SaaS مراكز قياس',
  ],
  authors: [{ name: 'منصة الخوارزمي — 3A لتكنولوجيا المعلومات' }],
  creator: 'منصة الخوارزمي',
  publisher: '3A لتكنولوجيا المعلومات',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ar-SA': SITE_URL,
      'ar-EG': SITE_URL,
      ar: SITE_URL,
    },
  },
  openGraph: {
    title: 'منصة الخوارزمي | منظومة تدريب القدرات والتحصيلي السحابية (SaaS)',
    description: 'المنصة السحابية الأولى لتدريب القدرات العامة والتحصيلي: بوابة الطالب الذكية، امتحانات محاكية لقياس، بنك أسئلة واستيراد Word/PDF، ومتابعة فورية.',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'منصة الخوارزمي',
    url: SITE_URL,
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'منصة الخوارزمي' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منصة الخوارزمي | منظومة تدريب القدرات والتحصيلي السحابية',
    description: 'المنصة السحابية المتكاملة لتدريب القدرات العامة والتحصيلي وإدارة مراكز التدريب.',
    images: ['/icons/icon-512.png'],
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

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'منصة الخوارزمي',
  description: 'منظومة سحابية متكاملة لتدريب القدرات العامة والتحصيلي وإدارة مراكز التدريب التعليمية.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web, Cloud SaaS, PWA, iOS, Android',
  url: 'https://markazak-saas.vercel.app/',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'SAR',
    description: 'تجربة مجانية واختبارات تجريبية فورية للطلاب والمراكز',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '190',
  },
  publisher: {
    '@type': 'Organization',
    name: '3A لتكنولوجيا المعلومات',
    url: 'https://3a-website.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.localStorage.getItem('mkz-theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
        <PWARegister />
        <Toaster
          position="top-left"
          toastOptions={{
            style: {
              fontFamily: 'IBM Plex Sans Arabic, Cairo, sans-serif',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
