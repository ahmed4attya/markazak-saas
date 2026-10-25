import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'markazak-saas.vercel.app';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || `${proto}://${host}`;
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL('/login?authError=' + encodeURIComponent('الدخول بحساب Google غير مفعّل على هذا الخادم حالياً'), req.url)
    );
  }

  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
