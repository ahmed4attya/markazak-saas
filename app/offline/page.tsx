'use client';

export default function Offline() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <div className="bento-card p-10 text-center max-w-md">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-3xl font-bold">خ</div>
        <h1 className="text-xl font-extrabold mb-3">لا يوجد اتصال بالإنترنت</h1>
        <p className="text-[color:var(--muted)] mb-8 leading-relaxed">المنصة تحتاج اتصالاً للعمل الكامل — سيستأنف كل شيء تلقائياً عند عودة الشبكة.</p>
        <button onClick={() => location.reload()} className="primary px-8 py-3">إعادة المحاولة</button>
      </div>
    </div>
  );
}