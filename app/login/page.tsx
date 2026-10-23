"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, BarChart3, LockKeyhole } from "lucide-react";
import Spotlight from "@/components/magicui/spotlight";

const VISUAL_CARDS = [
  { Icon: BarChart3, b: "لوحة تحكم ذكية", s: "مؤشرات التشغيل لحظة بلحظة" },
  { Icon: Brain, b: "مساعد AI", s: "تحليل وتقارير وقرارات" },
];

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const x = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await x.json();
    if (x.ok) r.push("/dashboard");
    else setErr(j.error || "خطأ");
    setLoading(false);
  }
  return (
    <main className="loginPage">
      <motion.div className="loginVisual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <Spotlight color="rgba(245,158,11,0.10)" />
        </div>
        <div className="orb" />
        <motion.div className="visualInner" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55 }}>
          <div className="brand big">
            <span>خ</span>
          </div>
          <h1>
            إدارة مركز التدريب
            <br />
            من مكان واحد
          </h1>
          <p>الطلاب، الدورات، الجداول، الحضور، المالية والشهادات.</p>
          <div className="visualCards">
            {VISUAL_CARDS.map((c, i) => (
              <motion.div key={c.b} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.14 }}>
                <c.Icon />
                <b>{c.b}</b>
                <small>{c.s}</small>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <motion.div className="loginBox" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55 }}>
        <div className="loginBrand">
          <span>خ</span>
          <div>
            <b>منصة الخوارزمي</b>
            <small>Al-Khwarizmi Platform</small>
          </div>
        </div>
        <h2>تسجيل الدخول</h2>
        <p className="muted">أدخل بيانات حسابك في منصة الخوارزمي</p>
        <form onSubmit={submit}>
          <label>البريد الإلكتروني</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>كلمة المرور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          {err && <div className="error">{err}</div>}
          <button className="primary full" disabled={loading}>
            {loading ? "جارٍ الدخول..." : "دخول إلى النظام"}
          </button>
        </form>
        <div className="secure">
          <LockKeyhole size={15} /> اتصال آمن ومشفر
        </div>
      </motion.div>
    </main>
  );
}