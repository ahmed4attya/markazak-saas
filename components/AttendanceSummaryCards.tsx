"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Clock3, ShieldCheck } from "lucide-react";

type AttendanceRow = {
  status?: string;
};

type AttendanceSummaryCardsProps = {
  title?: string;
};

export default function AttendanceSummaryCards({
  title = "ملخص الحضور",
}: AttendanceSummaryCardsProps) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/attendance", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setRows([]);
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

  const summary = useMemo(() => {
    return {
      present: rows.filter((row) => row.status === "present").length,
      absent: rows.filter((row) => row.status === "absent").length,
      late: rows.filter((row) => row.status === "late").length,
      excused: rows.filter((row) => row.status === "excused").length,
    };
  }, [rows]);

  const cards = [
    {
      key: "present",
      label: "حاضر",
      value: summary.present,
      description: "سجل حضور",
      icon: CheckCircle2,
      className: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      key: "absent",
      label: "غائب",
      value: summary.absent,
      description: "سجل غياب",
      icon: CircleAlert,
      className: "border-red-100 bg-red-50/70 text-red-700",
      iconClass: "bg-red-100 text-red-600",
    },
    {
      key: "late",
      label: "متأخر",
      value: summary.late,
      description: "سجل تأخير",
      icon: Clock3,
      className: "border-amber-100 bg-amber-50/70 text-amber-700",
      iconClass: "bg-amber-100 text-amber-600",
    },
    {
      key: "excused",
      label: "معذور",
      value: summary.excused,
      description: "سجل بعذر",
      icon: ShieldCheck,
      className: "border-blue-100 bg-blue-50/70 text-blue-700",
      iconClass: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            إحصاءات الحضور المسجلة في النظام
          </p>
        </div>

        {loading && (
          <span className="text-xs text-slate-400">جاري التحديث...</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.key}
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
