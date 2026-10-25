import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
import { getSession } from '@/lib/auth';
import { cleanText, parseQuestions, looksGarbled, ParsedQ } from '@/lib/pdf-questions';
import { extractFormJson, mineFormItems, mineAnswerKeys, htmlToQuestionText } from '@/lib/gform';
import { extractMsFormNode, mineMsForm } from '@/lib/msform';

export const runtime = 'nodejs';
export const maxDuration = 60;

const nodeRequire = createRequire(import.meta.url);
const KEYS = ['أ', 'ب', 'ج', 'د', 'هـ'];

const SKILL_RE = /^(.{2,60}?)\s*[\(（](\d{1,3})[\)）]\s*$/;
const SECTION_RE = /^القسم\s*(\d+)\s*[:：\-]?\s*(.*)$/;
const PASSAGE_HEAD_RE = /^(?:\[?(?:النص|المقطع|القطعة|نص|قطعة)\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+|[أ-ي]+)\]?\s*[:：\-–]?\s*(.*))$/;
const FIGURE_RE = /(?:في الشكل المجاور|الشكل أدناه|المثلث المجاور|الرسم البياني|الدائرة المجاورة|المربع المجاور|المستطيل|انظر الشكل|الموضح في الشكل|المنحنى|المدرج)/;

function isJunkText(t: string): boolean {
  const s = t.trim();
  if (s.length < 2 || s === '[]') return true;
  if (/^[0-9*/.\s\-—]+$/.test(s)) return true;
  if (/^[A-Za-z0-9_-]{30,}$/.test(s)) return true;
  if (/1FAIpQLS|t\.me|telegram|href=|<a\s|https?:\/\//i.test(s)) return true;
  if (/(بوت التسريبات|رابط البوت|قناة التليجرام|تليجرام|تيليجرام|#العراب|اشترك في قناة|تم إرسال إجابتك)/i.test(s)) return true;
  if (/^total points/i.test(s)) return true;
  if (/^(إرسال|محو( النموذج)?|التالي|الخلف|رجوع|الصفحة السابقة|الصفحة التالية|Google|نماذج Google|نماذج|لم تنشئ هذا النموذج\?|الإبلاغ عن إساءة الاستخدام|شروط الاستخدام|سياسة الخصوصية|مطلوب|Never submit passwords through Google Forms\.?)$/i.test(s)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح — سجل دخول أولاً' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let source = 'text';
    let letterless = false;
    let raw = '';
    let fileName = 'لصق نص';
    let parsedQuestionsList: ParsedQ[] = [];
    let note = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      source = String(body.source || 'text');
      letterless = Boolean(body.letterless);

      if (source === 'link') {
        const rawUrl = String(body.url || '').trim();
        if (!rawUrl || rawUrl.length < 10) {
          return NextResponse.json({ error: 'أدخل رابط النموذج' }, { status: 400 });
        }
        let url = rawUrl;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
        let host = '';
        try { host = new URL(url).hostname.toLowerCase(); } catch {
          return NextResponse.json({ error: 'الرابط غير صالح' }, { status: 400 });
        }
        const isG = host === 'docs.google.com' && url.includes('/forms/');
        const isMs = host.includes('forms.office.com') || host.includes('forms.cloud.microsoft') || host.includes('forms.microsoft.com');
        if (!isG && !isMs) {
          return NextResponse.json({ error: 'الروابط المدعومة: نماذج جوجل (docs.google.com/forms) ونماذج مايكروسوفت (forms.office.com)' }, { status: 400 });
        }

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) {
          return NextResponse.json({ error: `تعذر الوصول للنموذج (HTTP ${res.status})` }, { status: 400 });
        }
        const html = await res.text();
        fileName = (isMs ? 'نموذج مايكروسوفت — ' : 'نموذج جوجل — ') + url.slice(0, 80);

        if (isMs) {
          const form = extractMsFormNode(html);
          if (form) {
            parsedQuestionsList = mineMsForm(form).slice(0, 300).map(q => ({
              body: q.title,
              options: q.options.slice(0, 5).map((t, i) => ({ key: KEYS[i] || 'أ', text: t })),
              hasFigure: FIGURE_RE.test(q.title),
            }));
          }
        } else {
          const json = extractFormJson(html);
          if (json) {
            const formItems = mineFormItems(json);
            let currentPassage: string | null = null;

            for (const it of formItems) {
              if (it.kind === 't') {
                const t = it.text.trim();
                if (isJunkText(t)) continue;
                const sk = t.match(SKILL_RE);
                if (sk) {
                  currentPassage = null;
                  continue;
                }
                const sec = t.match(SECTION_RE);
                if (sec) {
                  currentPassage = null;
                  continue;
                }
                const passHead = t.match(PASSAGE_HEAD_RE);
                if (passHead) {
                  currentPassage = passHead[1] || t;
                } else if (t.length > 50) {
                  currentPassage = currentPassage ? currentPassage + '\n' + t : t;
                }
                continue;
              }

              if (it.kind === 'q') {
                const hasFigure = Boolean(it.imageUrl) || FIGURE_RE.test(it.title);
                parsedQuestionsList.push({
                  body: it.title,
                  options: it.options.slice(0, 5).map((t, i) => ({ key: KEYS[i] || 'أ', text: t })),
                  passage: currentPassage || undefined,
                  imageUrl: it.imageUrl,
                  hasFigure,
                });
              }
            }

            // If viewscore link, mine answer keys
            if (url.includes('/viewscore')) {
              const keyMap = mineAnswerKeys(html, parsedQuestionsList.map(q => ({ title: q.body, options: q.options.map(o => o.text) })));
              for (const q of parsedQuestionsList) {
                if (keyMap[q.body]) q.answerKey = keyMap[q.body];
              }
            }
          }

          if (parsedQuestionsList.length === 0) {
            parsedQuestionsList = parseQuestions(htmlToQuestionText(html), true).slice(0, 300);
          }
        }

        if (parsedQuestionsList.length === 0) {
          return NextResponse.json({ error: 'لم يُعثر على أسئلة اختيار من متعدد في هذا النموذج' }, { status: 400 });
        }

        const withAnswer = parsedQuestionsList.filter(q => q.answerKey).length;
        const withOptions = parsedQuestionsList.filter(q => q.options.length >= 2).length;
        const withPassage = parsedQuestionsList.filter(q => q.passage).length;
        const withFigures = parsedQuestionsList.filter(q => q.hasFigure || q.imageUrl).length;

        return NextResponse.json({
          ok: true,
          fileName,
          questions: parsedQuestionsList,
          withAnswer,
          withOptions,
          withPassage,
          withFigures,
          note: withPassage > 0 ? `تم استخراج ${withPassage} سؤالاً مرتبطاً بقطع استيعاب المقروء بنجاح!` : undefined,
        });
      } else {
        raw = String(body.text || '');
      }
    } else {
      const form = await req.formData();
      source = String(form.get('source') || 'text');
      letterless = String(form.get('letterless') || '') === '1';

      if (source === 'pdf' || source === 'docx') {
        const f = form.get('file') as unknown;
        if (!f || typeof (f as File).arrayBuffer !== 'function') {
          return NextResponse.json({ error: 'لم يتم إرسال ملف صالح' }, { status: 400 });
        }
        const file = f as File;
        fileName = file.name;
        const buf = Buffer.from(await file.arrayBuffer());

        if (source === 'pdf') {
          const pdfMod = nodeRequire('pdf-parse');
          if (typeof pdfMod === 'function') {
            const parsed = await pdfMod(buf);
            raw = parsed.text || '';
          } else if (pdfMod?.PDFParse) {
            const parser = new pdfMod.PDFParse({ data: buf });
            try {
              const res = await parser.getText();
              raw = typeof res === 'string' ? res : (res?.text || '');
            } finally {
              await parser.destroy().catch(() => {});
            }
          }
        } else {
          const mammoth = nodeRequire('mammoth');
          const r = await mammoth.extractRawText({ buffer: buf });
          raw = r?.value || '';
        }
      } else {
        raw = String(form.get('text') || '');
      }
    }

    const text = cleanText(raw);
    if (text.trim().length < 15) {
      return NextResponse.json({ error: 'لم يُستخرج نص كافٍ — قد يكون الملف ممسوحاً ضوئياً (صور)' }, { status: 400 });
    }

    const garbled = looksGarbled(text);
    const questions = parseQuestions(text, letterless);
    if (questions.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على أي أسئلة بصيغة صحيحة (راجع التنسيق والترقيم)' }, { status: 400 });
    }

    const withAnswer = questions.filter(q => q.answerKey).length;
    const withOptions = questions.filter(q => q.options.length >= 2).length;
    const withPassage = questions.filter(q => q.passage).length;
    const withFigures = questions.filter(q => q.hasFigure || q.imageUrl).length;
    if (withPassage > 0) {
      note = `تم استخراج ${withPassage} سؤالاً مرتبطاً بقطع استيعاب المقروء`;
    }

    return NextResponse.json({
      ok: true,
      fileName,
      garbled,
      textLength: text.length,
      questions,
      withAnswer,
      withOptions,
      withPassage,
      withFigures,
      note,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'فشل استخراج الأسئلة: ' + msg }, { status: 500 });
  }
}
