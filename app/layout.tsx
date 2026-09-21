import './globals.css';

export const metadata = {
  title: 'مركزك | Training Center OS',
  description: 'منصة إدارة مراكز التدريب',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}