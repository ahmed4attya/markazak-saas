"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Zap, KeyRound, BookOpen } from "lucide-react";

type PRow = {
  courseId: string;
  courseName: string;
  studentName?: string;
  total: number;
  done: number;
  pct: number;
  lastVideo: { id: string; title: string } | null;
};
type Me = {
  name: string;
  points?: number;
  level?: string;
  role?: string;
};

function BigRing({ pct }: { pct: number }) {
  const size = 130;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  const col =
    pct >= 80 ? "var(--success)"
    : pct >= 40 ? "var(--gold)"
    : "var(--blue)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full -rotate-90"
        viewBox={"0 0 " + size + " " + size}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--surface-3)" strokeWidth="8" fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={col} strokeWidth="8" fill="transparent"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <b className="text-2xl font-black">{pct}%</b>
      </span>
    </div>
  );
}

export default function PortalProgress() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<PRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/learner/progress").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([m, p]) => {
        setMe(m);
        setRows(Array.isArray(p) ? p : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tot = rows.reduce((a, r) => a + Number(r.total || 0), 0);
  const done = rows.reduce((a, r) => a + Number(r.done || 0), 0);
  const pct = tot ? Math.min(100, Math.round((done / tot) * 100)) : 0;

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={[
          "rounded-3xl p-5 flex flex-col items-center",
          "border border-[color:var(--gold-border)] relative",
          "overflow-hidden",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
        }}
      >
        <div
          className="absolute -bottom-16 -right-10 w-40 h-40 rounded-full"
          style={{
            background: "var(--gold-soft)",
            filter: "blur(40px)",
          }}
        />
        <h1 className="text-sm font-bold mb-3">تقدمي العام</h1>
        <BigRing pct={pct} />
        <p className="text-xs text-[color:var(--muted)] mt-3">
          {done} من {tot} مهمة منجزة عبر دوراتك
        </p>
      </motion.section>

      <section className="bento-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[color:var(--muted)]">
              مجموع نقاطك
            </p>
            <NumberFlow
              value={Number(me?.points || 0)}
              className="text-2xl font-black text-[color:var(--gold)]"
            />
            {me?.level && (
              <span className="text-xs font-semibold text-[color:var(--muted)]">
                المستوى: {me.level}
              </span>
            )}
          </div>
          <Zap size={30} style={{ color: "var(--gold)" }} />
        </div>
        <p className="text-[11px] text-[color:var(--muted-dim)] mt-3 leading-5">
          اجمع النقاط بمتابعتك دروسك ونجاحك في الاختبارات والتدريب اليومي.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
          <BookOpen size={16} style={{ color: "var(--blue)" }} />
          التفصيل حسب الدورة
        </h2>
        {loading && (
          <p className="text-xs text-[color:var(--muted)] py-4 text-center">
            جارٍ التحميل...
          </p>
        )}
        {!loading && rows.length === 0 && (
          <div className="bento-card p-5 text-center">
            <p className="text-sm font-semibold mb-3">
              لا توجد دورات مسجل بها بعد
            </p>
            <Link
              href="/portal/redeem"
              className={[
                "inline-flex items-center gap-1.5 text-xs font-bold",
                "px-4 py-2.5 rounded-xl text-[#3a2b06]",
              ].join(" ")}
              style={{ background: "var(--gold-cta)" }}
            >
              <KeyRound size={15} />
              تفعيل كود
            </Link>
          </div>
        )}
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <motion.div
              key={r.courseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="bento-card p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <b className="text-sm truncate">
                  {r.courseName}
                  {r.studentName ? " — " + r.studentName : ""}
                </b>
                <span
                  className="text-xs font-black shrink-0"
                  style={{ color: "var(--gold)" }}
                >
                  {r.pct}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--surface-3)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: r.pct + "%",
                    background: "var(--gold-cta)",
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <small className="text-[11px] text-[color:var(--muted)]">
                  {r.done} من {r.total} مهمة
                </small>
                <Link
                  href={"/portal/courses/" + r.courseId}
                  className="text-[11px] text-[color:var(--gold)]"
                >
                  فتح الدورة
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}