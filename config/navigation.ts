import { PAGE_ACCESS } from './access';

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

// Purely for UI organization and labeling. Roles are handled by access.ts.
export const NAVIGATION_CONFIG: NavGroup[] = [
  {
    title: 'الرئيسية',
    items: [
      { href: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
    ],
  },
  {
    title: 'العمليات',
    items: [
      { href: '/students', label: 'الطلاب', icon: 'Users' },
      { href: '/teachers', label: 'المعلمون', icon: 'GraduationCap' },
      { href: '/courses', label: 'الدورات', icon: 'BookOpen' },
      { href: '/groups', label: 'المجموعات', icon: 'Layers' },
      { href: '/attendance', label: 'الحضور والغياب', icon: 'CalendarCheck' },
      { href: '/library', label: 'مكتبة الملفات', icon: 'FolderOpen' },
      { href: '/videos', label: 'مكتبة الفيديو', icon: 'MonitorPlay' },
      { href: '/questions', label: 'بنك الأسئلة', icon: 'HelpCircle' },
      { href: '/exams', label: 'الامتحانات', icon: 'ClipboardList' },
      { href: '/lessons', label: 'الدروس', icon: 'BookMarked' },
      { href: '/assignments', label: 'الواجبات', icon: 'NotebookPen' },
      { href: '/gradebook', label: 'سجل الدرجات', icon: 'ClipboardList' },
      { href: '/finance', label: 'الفواتير والمدفوعات', icon: 'Wallet' },
      { href: '/certificates', label: 'الشهادات', icon: 'FileBadge' },
    ],
  },
  {
    title: 'التواصل السريع',
    items: [
      { href: '/reports', label: 'التقارير', icon: 'BarChart3' },
      { href: '/ai', label: 'المساعد الذكي', icon: 'Brain' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { href: '/users', label: 'المستخدمون والصلاحيات', icon: 'UserCog' },
      { href: '/settings', label: 'إعدادات المركز', icon: 'Settings' },
      { href: '/plans', label: 'الاشتراك', icon: 'CreditCard' },
      { href: '/activation-codes', label: 'أكواد التفعيل', icon: 'KeyRound' },
      { href: '/audit', label: 'سجل التدقيق', icon: 'ClipboardList' },
    ],
  },
];
