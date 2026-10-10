'use client';

import { useEffect, useState } from 'react';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPWA() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setEvt(e as PromptEvent);
      setHidden(false);
    }
    function onInstalled() { setHidden(true); setEvt(null); }
    if (window.matchMedia('(display-mode: standalone)').matches) { setHidden(true); return; }
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden || !evt) return null;
  return (
    <button
      onClick={async () => { await evt.prompt(); }}
      title="تثبيت التطبيق"
      aria-label="تثبيت التطبيق"
      className="theme-toggle"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    </button>
  );
}