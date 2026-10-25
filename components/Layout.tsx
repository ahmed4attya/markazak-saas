'use client';

import Shell from './Shell';

export default function Layout({
  children,
  title,
  sub,
}: {
  children: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <Shell title={title} subtitle={sub}>
      {children}
    </Shell>
  );
}
