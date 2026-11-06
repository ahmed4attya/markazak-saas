"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type QuestionCardData = {
  id: string;
  domain?: string;
  subject?: string | null;
  topic?: string | null;
  skill?: string | null;
  difficulty?: number;
  text: string;
  options: string[];
};

const DOMAIN_LABELS: Record<string, string> = { quant: "قدرات كمي", verbal: "قدرات لفظي", achievement: "تحصيلي" };
const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
const DIFF: Record<number, { label: string; soft: string; text: string }> = {
  1: { label: "سهل جداً", soft: "bg-[color:var(--success-soft)]", text: "text-[color:var(--success)]" },
  2: { label: "سهل", soft: "bg-[color:var(--success-soft)]", text: "text-[color:var(--success)]" },
  3: { label: "متوسط", soft: "bg-[color:var(--info-soft)]", text: "text-[color:var(--info)]" },
  4: { label: "صعب", soft: "bg-[color:var(--danger-soft)]", text: "text-[color:var(--danger)]" },
  5: { label: "صعب جداً", soft: "bg-[color:var(--danger-soft)]", text: "text-[color:var(--danger)]" },
};

export default function QuestionCard({
  q, chosen, revealed, correctIndex, explanation, onChoose, children,
}: {
  q: QuestionCardData;
  chosen: number | null;
  revealed: boolean;
  correctIndex?: number;
  explanation?: string | null;
  onChoose: (index: number) => void;
  children?: React.ReactNode;
}) {
  const diff = DIFF[q.difficulty || 3] || DIFF[3];
  const domainLabel = DOMAIN_LABELS[q.domain || ""] || q.domain || "";
  const contextChip = q.skill || q.topic || q.subject || "";

  return (
    <div className="bento-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {domainLabel && <span className="rounded-full bg-[color:var(--blue-soft)] px-3 py-1 text-xs font-bold text-[color:var(--blue)]">{domainLabel}</span>}
        {contextChip && <span className="rounded-full bg-[color:var(--surface-2)] px-3 py-1 text-xs font-bold text-[color:var(--text-soft)]">{contextChip}</span>}
        <span className={"rounded-full px-3 py-1 text-xs font-bold " + diff.soft + " " + diff.text}>{diff.label}</span>
      </div>

      <p className="text-xl font-bold leading-loose whitespace-pre-line text-[color:var(--text)]">{q.text}</p>

      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = revealed && correctIndex === i;
          const isWrongPick = revealed && isChosen && correctIndex !== i;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => onChoose(i)}
              className={
                "flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-right transition-all min-h-[44px] " +
                (revealed
                  ? isCorrect
                    ? "border-[color:var(--success)] bg-[color:var(--success-soft)]"
                    : isWrongPick
                      ? "border-[color:var(--danger)] bg-[color:var(--danger-soft)]"
                      : "border-[color:var(--border)] opacity-60"
                  : isChosen
                    ? "border-[color:var(--gold)] bg-[color:var(--gold-soft)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)]")
              }
            >
              <span
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black " +
                  (revealed && isCorrect
                    ? "bg-[color:var(--success)] text-white"
                    : revealed && isWrongPick
                      ? "bg-[color:var(--danger)] text-white"
                      : isChosen
                        ? "bg-[color:var(--gold)] text-[#0b0f17]"
                        : "bg-[color:var(--surface-3)] text-[color:var(--muted)]")
                }
              >
                {revealed && isCorrect ? "✓" : revealed && isWrongPick ? "✗" : LETTERS[i] ?? i + 1}
              </span>
              <span className="text-sm font-semibold leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          className={
            "rounded-2xl p-4 text-sm leading-relaxed " +
            (chosen === correctIndex
              ? "bg-[color:var(--success-soft)] text-[color:var(--success)]"
              : "bg-[color:var(--danger-soft)] text-[color:var(--danger)]")
          }
        >
          {chosen === correctIndex ? "إجابة صحيحة — أحسنت!" : explanation ? "الإجابة الصحيحة موضحة أعلاه — اقرأ الشرح:" : "إجابة خاطئة"}
          {explanation && chosen !== correctIndex && <p className="mt-1.5 text-[color:var(--text-soft)]">{explanation}</p>}
        </div>
      )}

      {children}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-[color:var(--muted)] hover:text-[color:var(--gold)]">
      <ArrowLeft size={14} /> {label}
    </Link>
  );
}
