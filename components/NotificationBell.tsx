'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setUnread(Number(data.unread) || 0);
      setItems(Array.isArray(data.rows) ? data.rows.slice(0, 6) : []);
    } catch {
      // quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-all' }),
      });
      setUnread(0);
      setItems((prev) => prev.map((item) => ({ ...item, read_at: new Date().toISOString() })));
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return 'الآن';
      if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
      if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
      return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-[color:var(--text-soft)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        aria-label="الإشعارات"
        title="الإشعارات"
      >
        <Bell size={20} className={unread > 0 ? 'text-amber-400' : ''} />
        {unread > 0 && (
          <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-[color:var(--border)] flex items-center justify-between bg-[color:var(--surface-2)]/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[color:var(--text)]">الإشعارات</span>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {unread} جديد
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition cursor-pointer disabled:opacity-50"
              >
                <CheckCheck size={14} />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[color:var(--border)]/50 custom-scrollbar">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-[color:var(--muted)]">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition hover:bg-[color:var(--surface-2)]/60 text-right ${
                    !item.read_at ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[color:var(--text)] line-clamp-1">
                      {item.title}
                    </span>
                    {!item.read_at && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                  {item.body && (
                    <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  )}
                  <span className="text-[10px] text-[color:var(--muted-dim)] mt-2 block">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-[color:var(--border)] bg-[color:var(--surface-2)]/30 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition"
            >
              <span>عرض جميع الإشعارات</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
