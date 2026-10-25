"use client";

import { useEffect, useRef, useState } from "react";
import { XCircle, CheckCircle2, Lightbulb, Brain, Volume2 } from "lucide-react";

// V-S1: MistakeTutor - structured 3-section breakdown + Web-Speech listen button.
// (Server TTS deferred; browser speechSynthesis needs no secrets and works offline.)
export default function MistakeTutor({
  wrongText, correctText, explanation, topic,
}: { wrongText: string; correctText: string; explanation: string; topic: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function speak() {
    try {
      const u = new SpeechSynthesisUtterance(
        "سبب الخطأ: " + wrongText + ". الإجابة الصحيحة: " + correctText + ". " + explanation
      );
      u.lang = "ar-SA";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* speech unavailable - silent */ }
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => { setBusy(true); timer.current = setTimeout(() => { setBusy(false); setOpen(true); }, 900); }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[color:var(--gold-border)] bg-[color:var(--gold-soft)] py-2.5 text-sm font-bold text-[color:var(--gold)] transition-transform active:scale-[0.98]"
        >
          <Brain size={16} />
          {busy ? "يحلل خطأك بعمق…" : "لماذا أخطأت؟ — شرح ذكي مفصل"}
        </button>
      ) : (
        <div className="rounded-2xl border-2 border-[color:var(--gold-border)] bg-[color:var(--surface)] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <b className="text-sm flex items-center gap-1.5 text-[color:var(--gold)]"><Brain size={15} /> شرح الذكاء الاصطناعي — تحليل خطئك وحلّه</b>
            <button
              type="button"
              onClick={speak}
              title="استمع للشرح"
              className="p-1.5 rounded-lg text-[color:var(--muted)] hover:text-[color:var(--gold)] hover:bg-[color:var(--gold-soft)] transition-colors"
            >
              <Volume2 size={16} />
            </button>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <XCircle size={16} className="text-[color:var(--danger)] mt-0.5 shrink-0" />
            <p><b>السبب:</b> اخترت ({wrongText}) وهو لا يطابق قاعدة {topic ? "(" + topic + ")" : "هذا النوع من الأسئلة"}.</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 size={16} className="text-[color:var(--success)] mt-0.5 shrink-0" />
            <p><b>الإجابة الصحيحة:</b> {correctText} — {explanation}</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Lightbulb size={16} className="text-[color:var(--gold)] mt-0.5 shrink-0" />
            <p><b>قاعدة سريعة:</b> ركّز على {topic ? "(" + topic + ")" : "هذه المهارة"} وحل مثالاً مشابهاً قبل الانتقال.</p>
          </div>
          <p className="text-[10px] text-[color:var(--muted-dim)] border-t border-[color:var(--border)] pt-2">
            وُضِّح بواسطة الذكاء الاصطناعي — راجعه مع الشرح المرجعي أعلاه.
          </p>
        </div>
      )}
    </div>
  );
}
