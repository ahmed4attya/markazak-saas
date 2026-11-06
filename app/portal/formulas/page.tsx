"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, BookOpen, Copy, Check, ChevronLeft, Bookmark, 
  Sparkles, Layers, RotateCw, Lightbulb, Zap, ArrowRight, Share2
} from "lucide-react";
import { MASTER_FORMULAS, SECTION_NAMES, FormulaItem } from "@/lib/formulas-data";

export default function PortalFormulasPage() {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "QUANTITATIVE" | "VERBAL">("ALL");
  const [activeSkill, setActiveSkill] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"GRID" | "FLASHCARD">("GRID");
  
  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Bookmarks / Mastered in localStorage
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("khawarizmi_saved_formulas");
      if (s) setSavedIds(JSON.parse(s));
    } catch {}
  }, []);

  function toggleSave(id: string) {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem("khawarizmi_saved_formulas", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Filter skills
  const skillsList = useMemo(() => {
    const list = Object.entries(SECTION_NAMES).map(([key, val]) => ({
      key,
      name: val.nameAr,
      icon: val.icon,
      category: val.category
    }));
    if (activeCategory === "ALL") return list;
    return list.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  // Filter formulas
  const filtered = useMemo(() => {
    return MASTER_FORMULAS.filter((f, idx) => {
      const fId = f.id || `f-${idx}`;
      if (activeCategory !== "ALL" && f.category !== activeCategory) return false;
      if (activeSkill !== "ALL" && f.sectionKey !== activeSkill) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.trim().toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.body.toLowerCase().includes(q) ||
        (f.example && f.example.toLowerCase().includes(q)) ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes(q)))
      );
    });
  }, [activeCategory, activeSkill, searchQuery]);

  function copyText(f: FormulaItem, idx: number) {
    const text = `📐 ${f.title}\n\nالقانون: ${f.body}\n${f.example ? `\nمثال: ${f.example}` : ''}\n\n— منصة الخوارزمي التعليمية`;
    navigator.clipboard.writeText(text);
    setCopiedId(f.id || `f-${idx}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden border border-[color:var(--gold-border)]"
        style={{
          background: "linear-gradient(135deg, rgba(22, 91, 51, 0.95) 0%, rgba(13, 59, 33, 0.98) 100%)",
          color: "#fff"
        }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-[color:var(--gold)] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-[color:var(--gold)] mb-2">
              <Sparkles size={14} /> مرجع قياس الشامل 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-black">بنك القوانين والاستراتيجيات الذهبية</h1>
            <p className="text-sm text-white/80 mt-1 max-w-xl">
              أكثر من {MASTER_FORMULAS.length} قانون واستراتيجية للحل السريع في أقل من 30 ثانية لكل سؤال في اختباري القدرات والتحصيلي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode(m => m === 'GRID' ? 'FLASHCARD' : 'GRID'); setIsFlipped(false); }}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md bg-white text-[#165B33] hover:bg-white/90"
            >
              {mode === 'GRID' ? (
                <>
                  <Layers size={16} /> وضع بطاقات الاستذكار (Flashcards)
                </>
              ) : (
                <>
                  <BookOpen size={16} /> العودة للشبكة الكاملة
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-2xl py-2">
            <p className="text-xl font-black text-[color:var(--gold)]">{MASTER_FORMULAS.filter(f => f.category === 'QUANTITATIVE').length}</p>
            <p className="text-[11px] text-white/70">قانون كمي</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-2">
            <p className="text-xl font-black text-[color:var(--gold)]">{MASTER_FORMULAS.filter(f => f.category === 'VERBAL').length}</p>
            <p className="text-[11px] text-white/70">استراتيجية لفظية</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-2">
            <p className="text-xl font-black text-[color:var(--gold)]">{savedIds.length}</p>
            <p className="text-[11px] text-white/70">محفوظة لديك</p>
          </div>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قانون، متطابقة، نسبة، مثلث فيثاغورس، علاقة تناظر..."
            className="w-full pr-10 pl-4 py-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-sm font-medium outline-none focus:border-[color:var(--gold)] transition shadow-sm"
          />
        </div>

        {/* Category Toggle Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] w-fit">
          <button
            onClick={() => { setActiveCategory("ALL"); setActiveSkill("ALL"); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${activeCategory === "ALL" ? "bg-[color:var(--surface)] shadow-sm text-[color:var(--text)]" : "text-[color:var(--muted)]"}`}
          >
            الكل ({MASTER_FORMULAS.length})
          </button>
          <button
            onClick={() => { setActiveCategory("QUANTITATIVE"); setActiveSkill("ALL"); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${activeCategory === "QUANTITATIVE" ? "bg-[color:var(--surface)] shadow-sm text-[color:var(--gold)]" : "text-[color:var(--muted)]"}`}
          >
            📐 قدرات كمي
          </button>
          <button
            onClick={() => { setActiveCategory("VERBAL"); setActiveSkill("ALL"); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${activeCategory === "VERBAL" ? "bg-[color:var(--surface)] shadow-sm text-[color:var(--gold)]" : "text-[color:var(--muted)]"}`}
          >
            📖 قدرات لفظي
          </button>
        </div>

        {/* Skills Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveSkill("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition border ${activeSkill === "ALL" ? "bg-[color:var(--gold-soft)] text-[color:var(--gold)] border-[color:var(--gold-border)] font-bold" : "bg-[color:var(--surface)] text-[color:var(--muted)] border-[color:var(--border)]"}`}
          >
            جميع المهارات
          </button>
          {skillsList.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSkill(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition border flex items-center gap-1.5 ${activeSkill === s.key ? "bg-[color:var(--gold-soft)] text-[color:var(--gold)] border-[color:var(--gold-border)] font-bold" : "bg-[color:var(--surface)] text-[color:var(--muted)] border-[color:var(--border)]"}`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: FLASHCARD RUNNER */}
      {mode === 'FLASHCARD' && (
        <div className="max-w-md mx-auto my-6 space-y-4">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[color:var(--muted)] py-12">لا توجد قوانين مطابقة لبحثك</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[color:var(--muted)] px-1">
                <span>بطاقة {cardIndex + 1} من {filtered.length}</span>
                <span>انقر على البطاقة للكشف عن الشرح والمثال</span>
              </div>

              {/* 3D Flip Card */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer min-h-[300px] p-6 rounded-3xl border border-[color:var(--gold-border)] bg-[color:var(--surface)] shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]"
                style={{
                  background: isFlipped 
                    ? "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)" 
                    : "linear-gradient(145deg, var(--surface-2) 0%, var(--surface) 100%)"
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[color:var(--gold-soft)] text-[color:var(--gold)]">
                      {filtered[cardIndex].category === 'QUANTITATIVE' ? '📐 كمي' : '📖 لفظي'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSave(filtered[cardIndex].id || `f-${cardIndex}`); }}
                      className="text-[color:var(--muted)] hover:text-[color:var(--gold)]"
                    >
                      <Bookmark 
                        size={18} 
                        className={savedIds.includes(filtered[cardIndex].id || `f-${cardIndex}`) ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : ""} 
                      />
                    </button>
                  </div>

                  <h3 className="text-xl font-black leading-snug">{filtered[cardIndex].title}</h3>

                  <div className="mt-4 p-4 rounded-2xl bg-[color:var(--surface-3)] font-mono text-base font-bold text-center border border-[color:var(--border)] leading-relaxed whitespace-pre-line">
                    {filtered[cardIndex].body}
                  </div>
                </div>

                {isFlipped ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-[color:var(--border)] space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--gold)]">
                      <Lightbulb size={14} /> مثال قياس المحاكي والحل:
                    </div>
                    <p className="text-xs text-[color:var(--text)] leading-relaxed bg-[color:var(--surface-2)] p-3 rounded-xl whitespace-pre-line">
                      {filtered[cardIndex].example || "تطبق هذه القاعدة مباشرة بتعويض المعطيات دون إجراء عمليات طويلة."}
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center text-xs text-[color:var(--muted)] pt-6 flex items-center justify-center gap-1">
                    <RotateCw size={13} /> اضغط لقلب البطاقة ومعاينة المثال
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  disabled={cardIndex === 0}
                  onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                  className="flex-1 py-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-xs font-bold disabled:opacity-40 transition"
                >
                  السابق
                </button>
                <button
                  onClick={() => { setIsFlipped(!isFlipped); }}
                  className="px-5 py-3 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-xs font-bold"
                >
                  قلب
                </button>
                <button
                  disabled={cardIndex >= filtered.length - 1}
                  onClick={() => { setCardIndex(i => Math.min(filtered.length - 1, i + 1)); setIsFlipped(false); }}
                  className="flex-1 py-3 rounded-2xl bg-[color:var(--gold-cta)] text-[#3a2b06] text-xs font-black disabled:opacity-40 transition shadow-sm"
                >
                  التالي
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODE 2: FULL GRID */}
      {mode === 'GRID' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="sm:col-span-2 text-center py-16 bg-[color:var(--surface)] rounded-3xl border border-[color:var(--border)]">
              <Search size={32} className="mx-auto text-[color:var(--muted)] mb-2 opacity-50" />
              <p className="font-bold text-sm">لم نجد أي قانون يطابق: &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-[color:var(--muted)] mt-1">جرب البحث بكلمات أخرى مثل &quot;فيثاغورس&quot; أو &quot;تناظر&quot;</p>
            </div>
          ) : (
            filtered.map((f, idx) => {
              const fId = f.id || `f-${idx}`;
              const isSaved = savedIds.includes(fId);
              const isCopied = copiedId === fId;

              return (
                <motion.div
                  key={fId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 flex flex-col justify-between hover:border-[color:var(--gold-border)] transition shadow-sm"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[color:var(--gold-soft)] text-[color:var(--gold)]">
                          {f.category === 'QUANTITATIVE' ? '📐 كمي' : '📖 لفظي'}
                        </span>
                        {f.sectionKey && SECTION_NAMES[f.sectionKey] && (
                          <span className="text-[11px] text-[color:var(--muted)]">
                            {SECTION_NAMES[f.sectionKey].icon} {SECTION_NAMES[f.sectionKey].nameAr}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyText(f, idx)}
                          title="نسخ القانون"
                          className="w-8 h-8 rounded-lg grid place-items-center text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition"
                        >
                          {isCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                        </button>
                        <button
                          onClick={() => toggleSave(fId)}
                          title="حفظ في المفضلة"
                          className="w-8 h-8 rounded-lg grid place-items-center text-[color:var(--muted)] hover:text-[color:var(--gold)] hover:bg-[color:var(--surface-2)] transition"
                        >
                          <Bookmark size={15} className={isSaved ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : ""} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base leading-snug">{f.title}</h3>

                    {/* Formula Body */}
                    <div className="mt-3 p-3.5 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] font-mono text-sm font-bold text-center leading-relaxed whitespace-pre-line text-[color:var(--gold)]">
                      {f.body}
                    </div>

                    {/* Example Box */}
                    {f.example && (
                      <div className="mt-3 p-3 rounded-xl bg-[color:var(--surface-3)] text-xs space-y-1">
                        <span className="font-bold text-[color:var(--muted)] block">مثال قياس:</span>
                        <p className="text-[color:var(--text)] whitespace-pre-line leading-relaxed font-sans">{f.example}</p>
                      </div>
                    )}
                  </div>

                  {/* Tags footer */}
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[color:var(--border)]">
                      {f.tags.map(t => (
                        <span key={t} className="text-[10px] text-[color:var(--muted)] bg-[color:var(--surface-2)] px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
