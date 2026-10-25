import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
import path from 'path';
import url from 'url';
import fs from 'fs';
import { getSession } from '@/lib/auth';
import { cleanText, parseQuestions, looksGarbled, ParsedQ } from '@/lib/pdf-questions';
import { extractFormJson, mineFormItems, mineAnswerKeys, htmlToQuestionText } from '@/lib/gform';
import { extractMsFormNode, mineMsForm } from '@/lib/msform';

export const runtime = 'nodejs';
export const maxDuration = 60;

const nodeRequire = createRequire(import.meta.url);
const KEYS = ['أ', 'ب', 'ج', 'د', 'هـ'];

function findLocalWorkerUrl(): string | null {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs'),
    path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
    path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return url.pathToFileURL(c).href;
    }
  }
  // worker path resolved via candidates
  return null;
}

async function extractPdfText(buf: Buffer): Promise<string> {
  const workerUrl = findLocalWorkerUrl();

  // Strategy 1: pdf-parse with local worker file url
  try {
    const pdfMod = nodeRequire('pdf-parse');
    if (pdfMod?.PDFParse) {
      if (workerUrl) {
        try {
          pdfMod.PDFParse.setWorker(workerUrl);
        } catch (wErr) {
          console.warn('[PDF] setWorker notice:', wErr);
        }
      }
      const parser = new pdfMod.PDFParse({ data: buf });
      try {
        const res = await parser.getText();
        if (res?.pages && Array.isArray(res.pages) && res.pages.length > 0) {
          const txt = res.pages.map((p: { text?: string }) => p.text || '').join('\n');
          if (txt.trim().length > 10) return txt;
        }
        if (typeof res === 'string' && res.trim().length > 10) return res;
        if (res?.text && res.text.trim().length > 10) return res.text;
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else if (typeof pdfMod === 'function') {
      const parsed = await pdfMod(buf);
      if (parsed?.text && parsed.text.trim().length > 10) return parsed.text;
    }
  } catch (parseErr: any) {
    console.warn('[PDF] PDFParse parser error, attempting legacy pdfjs:', parseErr?.message || parseErr);
  }

  // Strategy 2: Direct in-process PDF.js legacy extraction fallback
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (workerUrl && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    }
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    }).promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      pageTexts.push(strings.join(' '));
    }
    const fullText = pageTexts.join('\n');
    if (fullText.trim().length > 10) {
      return fullText;
    }
  } catch (pdfjsErr: any) {
    console.warn('[PDF] legacy pdfjs extraction failed:', pdfjsErr?.message || pdfjsErr);
  }

  return '';
}

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
                const t = it.title.trim();
                if (t.startsWith('/forms') || t.startsWith('forms/') || t.length < 3) continue;
                const hasFigure = Boolean(it.imageUrl) || FIGURE_RE.test(it.title);
                parsedQuestionsList.push({
                  body: it.title,
                  options: it.options.slice(0, 5).map((text, i) => ({ key: KEYS[i] || 'أ', text })),
                  passage: currentPassage || undefined,
                  imageUrl: it.imageUrl,
                  hasFigure,
                });
              }
            }

            // If viewscore link, mine answer keys
            if (url.includes('/viewscore')) {
              const keyMap = mineAnswerKeys(
                html,
                parsedQuestionsList.map((q) => ({ title: q.body, options: q.options.map((o) => o.text) }))
              );
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

        const notes: string[] = [];
        if (withAnswer > 0) notes.push(`تم استخراج ${withAnswer} إجابة صحيحة تلقائياً من نموذج الإجابات!`);
        if (withPassage > 0) notes.push(`تم ربط ${withPassage} سؤالاً بقطع استيعاب المقروء`);

        return NextResponse.json({
          ok: true,
          fileName,
          questions: parsedQuestionsList,
          withAnswer,
          withOptions,
          withPassage,
          withFigures,
          note: notes.length > 0 ? notes.join(' • ') : undefined,
        });
      } else {
        raw = String(body.text || '');
      }
    } else {
      let form: FormData;
      try {
        form = await req.formData();
      } catch (formErr: unknown) {
        const msg = formErr instanceof Error ? formErr.message : String(formErr);
        return NextResponse.json({
          error: `تعذر قراءة بيانات الملف المرفوع (${msg}). تأكد من أن حجم الملف مناسب واستقرار الاتصال بالإنترنت.`,
        }, { status: 400 });
      }

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
          try {
            raw = await extractPdfText(buf);
          } catch (pdfErr: unknown) {
            const errName = (pdfErr as Error)?.name || '';
            const errMsg = (pdfErr as Error)?.message || '';
            if (errName === 'InvalidPDFException' || errMsg.includes('Invalid PDF')) {
              return NextResponse.json({
                error: 'الملف المرفوع ليس ملف PDF صالحاً أو تالفاً. يرجى التأكد من سلامة الملف وحفظه بصيغة PDF صحيحة.',
              }, { status: 400 });
            }
            if (errName === 'PasswordException' || errMsg.includes('password')) {
              return NextResponse.json({
                error: 'ملف PDF محمي بكلمة مرور. يرجى إزالة الحماية بكلمة مرور ثم رفعه مجدداً.',
              }, { status: 400 });
            }
            return NextResponse.json({
              error: `تعذر قراءة ملف PDF: ${errMsg || 'خطأ في معالجة الملف'}. جرب نسخ النص ولصقه مباشرة أو تحويله إلى Word.`,
            }, { status: 400 });
          }
        } else {
          try {
            const mammoth = nodeRequire('mammoth');
            const r = await mammoth.extractRawText({ buffer: buf });
            raw = r?.value || '';
          } catch (docxErr: unknown) {
            const errMsg = (docxErr as Error)?.message || '';
            return NextResponse.json({
              error: `تعذر قراءة ملف Word: ${errMsg || 'تأكد أن الملف بصيغة docx غير تالفة'}.`,
            }, { status: 400 });
          }
        }
      } else {
        raw = String(form.get('text') || '');
      }
    }

    const text = cleanText(raw);
    if (text.trim().length < 15) {
      return NextResponse.json({
        error: 'لم يُستخرج نص كافٍ من الملف — يرجى التأكد أن الملف يحتوي على نصوص وليس صوراً ممسوحة ضوئياً (Scanned). إذا كان الملف عبارة عن صور، يمكنك لصق الأسئلة مباشرة في تبويب (لصق نص).',
      }, { status: 400 });
    }

    const garbled = looksGarbled(text);
    let questions = parseQuestions(text, letterless);
    // Automatic smart fallback: if regular parse finds no questions, try letterless mode
    if (questions.length === 0 && !letterless) {
      questions = parseQuestions(text, true);
    }
    if (questions.length === 0) {
      return NextResponse.json({
        error: 'لم يتم العثور على أي أسئلة بصيغة صحيحة (تأكد أن كل سؤال يتبعه خياراته أ، ب، ج، د، أو فقرات واضحة)',
      }, { status: 400 });
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
