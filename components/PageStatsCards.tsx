"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  UserRoundCheck,
  BookOpen,
  Layers3,
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Archive,
  FilePenLine,
  BriefcaseBusiness,
} from "lucide-react";

type StatsMode = "students" | "teachers" | "groups" | "courses" | "attendance";

type Stats = {
  students: {
    total: number;
    active: number;
    graduated: number;
    suspended: number;
  };
  teachers: {
    total: number;
    active: number;
    inactive: number;
    specialties: number;
  };
  courses: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  groups: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
};

type PageStatsCardsProps = {
  mode: StatsMode;
  title?: string;
};

const emptyStats: Stats = {
  students: {
    total: 0,
    active: 0,
    graduated: 0,
    suspended: 0,
  },
  teachers: {
    total: 0,
    active: 0,
    inactive: 0,
    specialties: 0,
  },
  courses: {
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
  },
  groups: {
    total: 0,
    active: 0,
    scheduled: 0,
    completed: 0,
  },
  attendance: {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  },
};

export default function PageStatsCards({ mode, title }: PageStatsCardsProps) {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active) {
          setStats({
            students: {
              ...emptyStats.students,
              ...data.students,
            },
            teachers: {
              ...emptyStats.teachers,
              ...data.teachers,
            },
            courses: {
              ...emptyStats.courses,
              ...data.courses,
            },
            groups: {
              ...emptyStats.groups,
              ...data.groups,
            },
            attendance: {
              ...emptyStats.attendance,
              ...data.attendance,
            },
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const definitions = {
    students: {
      title: title || "إحصائيات الطلاب",
      cards: [
        {
          label: "إجمالي الطلاب",
          value: stats.students.total,
          description: "جميع الطلاب المسجلين",
          icon: Users,
          className: "border-blue-100 bg-blue-50/70 text-blue-700",
          iconClass: "bg-blue-100 text-blue-600",
        },
        {
          label: "الطلاب النشطون",
          value: stats.students.active,
          description: "طلاب بحالة نشطة",
          icon: UserCheck,
          className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
          iconClass: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "المتخرجون",
          value: stats.students.graduated,
          description: "طلاب أكملوا البرنامج",
          icon: GraduationCap,
          className: "border-violet-100 bg-violet-50/70 text-violet-700",
          iconClass: "bg-violet-100 text-violet-600",
        },
        {
          label: "الموقوفون",
          value: stats.students.suspended,
          description: "طلاب بحالة إيقاف",
          icon: UserX,
          className: "border-red-100 bg-red-50/70 text-red-700",
          iconClass: "bg-red-100 text-red-600",
        },
      ],
    },

    teachers: {
      title: title || "إحصائيات المدربين",
      cards: [
        {
          label: "إجمالي المدربين",
          value: stats.teachers.total,
          description: "جميع المدربين",
          icon: BriefcaseBusiness,
          className: "border-blue-100 bg-blue-50/70 text-blue-700",
          iconClass: "bg-blue-100 text-blue-600",
        },
        {
          label: "المدربون النشطون",
          value: stats.teachers.active,
          description: "مدربون بحالة نشطة",
          icon: UserRoundCheck,
          className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
          iconClass: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "غير النشطين",
          value: stats.teachers.inactive,
          description: "مدربون غير نشطين",
          icon: UserX,
          className: "border-red-100 bg-red-50/70 text-red-700",
          iconClass: "bg-red-100 text-red-600",
        },
        {
          label: "التخصصات",
          value: stats.teachers.specialties,
          description: "التخصصات المسجلة",
          icon: Layers3,
          className: "border-violet-100 bg-violet-50/70 text-violet-700",
          iconClass: "bg-violet-100 text-violet-600",
        },
      ],
    },

    groups: {
      title: title || "إحصائيات المجموعات",
      cards: [
        {
          label: "إجمالي المجموعات",
          value: stats.groups.total,
          description: "جميع المجموعات",
          icon: Layers3,
          className: "border-blue-100 bg-blue-50/70 text-blue-700",
          iconClass: "bg-blue-100 text-blue-600",
        },
        {
          label: "المجموعات النشطة",
          value: stats.groups.active,
          description: "مجموعات تعمل حاليًا",
          icon: UserRoundCheck,
          className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
          iconClass: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "المجدولة",
          value: stats.groups.scheduled,
          description: "مجموعات مجدولة",
          icon: CalendarCheck2,
          className: "border-amber-100 bg-amber-50/70 text-amber-700",
          iconClass: "bg-amber-100 text-amber-600",
        },
        {
          label: "حضور الطلاب",
          value: stats.attendance.present,
          description: "إجمالي سجلات الحضور",
          icon: CheckCircle2,
          className: "border-cyan-100 bg-cyan-50/70 text-cyan-700",
          iconClass: "bg-cyan-100 text-cyan-600",
        },
      ],
    },

    courses: {
      title: title || "إحصائيات الدورات",
      cards: [
        {
          label: "إجمالي الدورات",
          value: stats.courses.total,
          description: "جميع الدورات",
          icon: BookOpen,
          className: "border-blue-100 bg-blue-50/70 text-blue-700",
          iconClass: "bg-blue-100 text-blue-600",
        },
        {
          label: "الدورات النشطة",
          value: stats.courses.active,
          description: "دورات متاحة حاليًا",
          icon: CheckCircle2,
          className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
          iconClass: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "المسودات",
          value: stats.courses.draft,
          description: "دورات قيد الإعداد",
          icon: FilePenLine,
          className: "border-amber-100 bg-amber-50/70 text-amber-700",
          iconClass: "bg-amber-100 text-amber-600",
        },
        {
          label: "المؤرشفة",
          value: stats.courses.archived,
          description: "دورات مؤرشفة",
          icon: Archive,
          className: "border-slate-200 bg-slate-100/80 text-slate-700",
          iconClass: "bg-slate-200 text-slate-600",
        },
      ],
    },

    attendance: {
      title: title || "إحصائيات الحضور",
      cards: [
        {
          label: "إجمالي السجلات",
          value: stats.attendance.total,
          description: "جميع سجلات الحضور",
          icon: CalendarCheck2,
          className: "border-blue-100 bg-blue-50/70 text-blue-700",
          iconClass: "bg-blue-100 text-blue-600",
        },
        {
          label: "حاضر",
          value: stats.attendance.present,
          description: "سجلات حضور",
          icon: CheckCircle2,
          className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
          iconClass: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "غائب",
          value: stats.attendance.absent,
          description: "سجلات غياب",
          icon: CircleAlert,
          className: "border-red-100 bg-red-50/70 text-red-700",
          iconClass: "bg-red-100 text-red-600",
        },
        {
          label: "متأخر",
          value: stats.attendance.late,
          description: "سجلات تأخير",
          icon: Clock3,
          className: "border-amber-100 bg-amber-50/70 text-amber-700",
          iconClass: "bg-amber-100 text-amber-600",
        },
      ],
    },
  } as const;

  const definition = definitions[mode];

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {definition.title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            إحصائيات مباشرة من بيانات النظام
          </p>
        </div>

        {loading && (
          <span className="text-xs text-slate-400">جاري التحديث...</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {definition.cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">{card.label}</p>

                  <div className="mt-2 text-3xl font-black tracking-tight">
                    {card.value}
                  </div>

                  <p className="mt-1 text-xs opacity-70">{card.description}</p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
