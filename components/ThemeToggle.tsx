'use client';

export default function ThemeToggle() {
  function toggleTheme() {
    try {
      const el = document.documentElement;
      const next = el.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      if (next === 'light') {
        el.setAttribute('data-theme', 'light');
      } else {
        el.removeAttribute('data-theme');
      }
      try {
        window.localStorage.setItem('mkz-theme', next);
      } catch (e2) {
        void e2;
      }
    } catch (e1) {
      void e1;
    }
  }
  return (
    <button
      onClick={toggleTheme}
      title="تبديل المظهر"
      aria-label="تبديل المظهر"
      className="theme-toggle"
    >
      <span className="icon-sun">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
      </span>
      <span className="icon-moon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      </span>
    </button>
  );
}