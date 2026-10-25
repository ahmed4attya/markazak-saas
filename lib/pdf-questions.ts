export type ParsedQ = {
  body: string;
  options: { key: string; text: string }[];
  answerKey?: string;
  passage?: string;
  imageUrl?: string;
  hasFigure?: boolean;
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function cleanText(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)))
    .replace(/\r/g, "\n").replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]+/g, " ")
    .split("\n").map(l => l.trim())
    .filter(l => l.length > 0 && !/^(صفحة|Page)\s*\d+$/i.test(l))
    .join("\n");
}

export function looksGarbled(text: string): boolean {
  const arabic = text.replace(/[^\u0600-\u06FF]/g, "");
  if (arabic.length < 100) return false;
  let dup = 0;
  for (let i = 1; i < arabic.length; i++) if (arabic[i] === arabic[i - 1]) dup++;
  return dup / arabic.length > 0.12;
}

const Q_START = /^(?:(?:س|السؤال)\s*)?(\d{1,3})\s*[).:\-–]\s*/;
const OPT = /^[\(（]?([أ-دA-Da-d])[\)）.:\-–]\s*/;
const ANS = /^(?:الإجابة|الاجابة|الجواب|الإجابة\s*الصحيحة|الاجابة\s*الصحيحة|الجواب\s*الصحيح)\s*(?:هي|هو)?\s*[:\-–]?\s*([أ-دA-Da-d1-4])/;
const ANS_INLINE = /[\s(（]+(?:صح|الصحيحة|الصحيح|✓|✔|\*)[\s)）]*$/;
const PASSAGE_HEAD_RE = /^(?:\[?(?:النص|المقطع|القطعة|نص|قطعة)\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+|[أ-ي]+)\]?\s*[:：\-–]?\s*(.*))$/;
const PASSAGE_EXPLICIT_RE = /^(?:\[?القطعة|\[?نص الاستيعاب|\[?قطعة القراءة)\s*[:：\-–]\s*(.*)$/;
const FIGURE_RE = /(?:في الشكل المجاور|الشكل أدناه|المثلث المجاور|الرسم البياني|الدائرة المجاورة|المربع المجاور|المستطيل|انظر الشكل|الموضح في الشكل|المنحنى|المدرج)/;
const IMG_MARKDOWN_RE = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/;
const URL_IMAGE_RE = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|svg|webp|gif)(?:\?[^\s]+)?)/i;

function normKey(c: string): string | null {
  const map: Record<string, string> = {
    "أ": "أ", "ا": "أ", "A": "أ", "a": "أ", "1": "أ",
    "ب": "ب", "B": "ب", "b": "ب", "2": "ب",
    "ج": "ج", "C": "ج", "c": "ج", "3": "ج",
    "د": "د", "D": "د", "d": "د", "4": "د",
  };
  return map[c] ?? null;
}

function splitInlineOptions(line: string): { key: string; text: string }[] | null {
  const re = /([أ-د])\s*[:.)\-–]/g;
  const marks = [...line.matchAll(re)];
  if (marks.length < 3) return null;
  const keys = marks.map(m => m[1]);
  if (new Set(keys).size !== keys.length) return null;
  if (!["أ", "ب", "ج"].every(k => keys.includes(k))) return null;
  const opts: { key: string; text: string }[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index! + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index! : line.length;
    const txt = line.slice(start, end).trim();
    if (!txt) return null;
    opts.push({ key: marks[i][1], text: txt });
  }
  return opts.length <= 5 ? opts : null;
}

export function parseQuestions(text: string, letterless = false): ParsedQ[] {
  if (letterless) return parseLetterless(text);
  const lines = cleanText(text).split("\n");
  const out: ParsedQ[] = [];
  let currentPassage: string | null = null;
  let cur: { body: string[]; options: { key: string; text: string }[]; answerKey?: string; imageUrl?: string } | null = null;

  const push = () => {
    if (cur && cur.body.join(" ").trim().length > 5 && cur.options.length >= 2) {
      const fullBody = cur.body.join(" ").trim();
      const hasFigure = FIGURE_RE.test(fullBody) || Boolean(cur.imageUrl);
      out.push({
        body: fullBody,
        options: cur.options,
        answerKey: cur.answerKey,
        passage: currentPassage || undefined,
        imageUrl: cur.imageUrl,
        hasFigure,
      });
    }
    cur = null;
  };

  for (const line of lines) {
    // Check for reading passage markers
    const passExp = line.match(PASSAGE_EXPLICIT_RE);
    const passHead = line.match(PASSAGE_HEAD_RE);
    if (passExp || passHead) {
      push();
      const initialText = (passExp ? passExp[1] : (passHead ? passHead[1] : "")).replace(/[\]\[]/g, "").trim();
      currentPassage = initialText || line;
      continue;
    }

    // Check for embedded image URLs in text
    let detectedImgUrl: string | undefined;
    const mdImg = line.match(IMG_MARKDOWN_RE);
    if (mdImg) detectedImgUrl = mdImg[1];
    else {
      const rawImg = line.match(URL_IMAGE_RE);
      if (rawImg) detectedImgUrl = rawImg[1];
    }

    const am = line.match(ANS);
    if (am && cur) {
      const k = normKey(am[1]);
      if (k) cur.answerKey = k;
      continue;
    }

    const qm = line.match(Q_START);
    if (qm) {
      const bodyLen = cur ? cur.body.join(" ").length : 0;
      if (!cur || cur.options.length > 0 || bodyLen > 30) {
        push();
        cur = {
          body: [line.replace(Q_START, "")],
          options: [],
          imageUrl: detectedImgUrl,
        };
        continue;
      }
    }

    if (cur) {
      if (detectedImgUrl && !cur.imageUrl) cur.imageUrl = detectedImgUrl;

      const inline = splitInlineOptions(line);
      if (inline) {
        for (const o of inline) {
          let t = o.text;
          let key: string | undefined;
          const m = t.match(ANS_INLINE);
          if (m) { t = t.replace(ANS_INLINE, "").trim(); key = o.key; }
          const ex = cur.options.find(x => x.key === o.key);
          if (ex) { if (t) ex.text += " " + t; }
          else cur.options.push({ key: o.key, text: t });
          if (key && !cur.answerKey) cur.answerKey = key;
        }
        continue;
      }
    }

    const om = line.match(OPT);
    if (om && cur) {
      const k = normKey(om[1]);
      let txt = line.replace(OPT, "").trim();
      if (k) {
        const m = txt.match(ANS_INLINE);
        if (m) { txt = txt.replace(ANS_INLINE, "").trim(); if (!cur.answerKey) cur.answerKey = k; }
        const exists = cur.options.find(o => o.key === k);
        if (exists) { if (txt) exists.text += " " + txt; } else cur.options.push({ key: k, text: txt });
        continue;
      }
    }

    if (cur) {
      cur.body.push(line);
    } else if (currentPassage && line.length > 20) {
      // Append multi-line passage text before questions begin
      currentPassage += "\n" + line;
    }
  }

  push();
  return out;
}

function parseLetterless(text: string): ParsedQ[] {
  const lines = cleanText(text).split("\n");
  const blocks: string[][] = [];
  let cur: string[] = [];
  let count = 0;
  let currentPassage: string | null = null;

  for (const line of lines) {
    const passExp = line.match(PASSAGE_EXPLICIT_RE) || line.match(PASSAGE_HEAD_RE);
    if (passExp) {
      currentPassage = line;
      continue;
    }

    const looksQuestion = /[؟?]$/.test(line) && line.length <= 200;
    if (looksQuestion && count >= 5) { blocks.push(cur); cur = []; count = 0; }
    if (Q_START.test(line) && cur.length > 0 && count >= 3) { blocks.push(cur); cur = []; count = 0; }
    cur.push(line); count++;
  }
  if (cur.length) blocks.push(cur);
  const out: ParsedQ[] = [];
  for (const b of blocks) {
    let answerKey: string | undefined;
    let imageUrl: string | undefined;
    const bodyLines: string[] = [];
    const bullets: { key: string; text: string }[] = [];
    for (const ln of b) {
      const rawImg = ln.match(URL_IMAGE_RE);
      if (rawImg && !imageUrl) imageUrl = rawImg[1];

      const am = ln.match(ANS);
      if (am) { answerKey = normKey(am[1]) ?? undefined; continue; }
      const bm = ln.match(/^[-•●*]\s+(.*)$/);
      if (bm) {
        let t = bm[1].trim();
        const m = t.match(ANS_INLINE);
        if (m) { t = t.replace(ANS_INLINE, "").trim(); if (!answerKey) answerKey = ["أ", "ب", "ج", "د", "هـ"][bullets.length]; }
        if (t) bullets.push({ key: ["أ", "ب", "ج", "د", "هـ"][bullets.length] ?? "هـ", text: t });
        continue;
      }
      bodyLines.push(ln);
    }
    if (bodyLines.length === 0) continue;
    bodyLines[0] = bodyLines[0].replace(Q_START, "").trim();
    const nonEmpty = bodyLines.filter(l => l.trim());
    const fullBody = nonEmpty.join(" ").trim();
    const hasFigure = FIGURE_RE.test(fullBody) || Boolean(imageUrl);

    if (bullets.length >= 2) {
      if (fullBody.length > 5) {
        out.push({ body: fullBody, options: bullets, answerKey, passage: currentPassage || undefined, imageUrl, hasFigure });
        continue;
      }
    }
    if (nonEmpty.length >= 5) {
      const tail = nonEmpty.slice(-4);
      if (tail.every(l => l.trim().length <= 80)) {
        const body = nonEmpty.slice(0, -4).join(" ").trim();
        if (body.length > 5)
          out.push({
            body,
            options: tail.map((t, i) => ({ key: ["أ", "ب", "ج", "د"][i], text: t.trim() })),
            answerKey,
            passage: currentPassage || undefined,
            imageUrl,
            hasFigure: FIGURE_RE.test(body) || Boolean(imageUrl),
          });
        continue;
      }
    }
    if (nonEmpty.length >= 3) {
      const body = nonEmpty[0];
      const opts = nonEmpty.slice(1).map((t, i) => ({ key: ["أ", "ب", "ج", "د", "هـ"][i] ?? "هـ", text: t.trim() }));
      out.push({
        body,
        options: opts,
        answerKey,
        passage: currentPassage || undefined,
        imageUrl,
        hasFigure: FIGURE_RE.test(body) || Boolean(imageUrl),
      });
    }
  }
  return out;
}
