import './globals.css';

export const metadata = {
  title: 'سنتر الخوارزمي | Al-Khwarizmi Center',
  description: 'منصة إدارة مراكز التدريب',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body><script dangerouslySetInnerHTML={{ __html: "(function(){try{if(window.localStorage.getItem('mkz-theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();" }} />{children}</body>
    </html>
  );
}