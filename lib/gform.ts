export type GFormQ = { title: string; options: string[]; imageUrl?: string };

export function extractFormJson(html: string): unknown | null {
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);?\s*<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch {
    const m2 = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);
    if (m2) { try { return JSON.parse(m2[1]); } catch { return null; } }
    return null;
  }
}

function isOptGroup(v: unknown): v is unknown[][] {
  return Array.isArray(v) && v.length >= 2 &&
    v.every(el => Array.isArray(el) && el.length > 0 &&
      typeof el[0] === "string" && (el[0] as string).trim().length > 0 &&
      !/^entry\.\d+$/.test((el[0] as string).trim()));
}

function findImageUrlInNode(node: unknown): string | undefined {
  if (typeof node === "string") {
    if (/^https?:\/\/.*(?:googleusercontent\.com|drive\.google\.com|\.(?:png|jpg|jpeg|svg|webp|gif))/i.test(node)) {
      return node;
    }
    return undefined;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findImageUrlInNode(child);
      if (found) return found;
    }
  }
  return undefined;
}

export function mineQuestions(json: unknown): GFormQ[] {
  const out: GFormQ[] = [];
  const seen = new Set<string>();
  function walk(node: unknown[], anc: unknown[][]): void {
    if (isOptGroup(node)) {
      const options = node.map(el => String(el[0]).trim());
      const imageUrl = findImageUrlInNode(anc[anc.length - 1]);
      for (let a = anc.length - 1; a >= 0; a--) {
        const strings = anc[a].filter(el =>
          typeof el === "string" && (el as string).trim().length >= 6 && (el as string).trim().length <= 400) as string[];
        const title = strings.find(t => !options.includes(t.trim()) && !/^entry\./.test(t));
        if (title) {
          const key = title + "||" + options.join("|");
          if (!seen.has(key)) { seen.add(key); out.push({ title: title.trim(), options, imageUrl }); }
          break;
        }
      }
    }
    for (const child of node) if (Array.isArray(child)) walk(child, [...anc, node]);
  }
  if (Array.isArray(json)) walk(json, []);
  return out;
}

export type FormItem =
  | { kind: "q"; title: string; options: string[]; imageUrl?: string }
  | { kind: "t"; text: string };

export function mineFormItems(json: unknown): FormItem[] {
  const out: FormItem[] = [];
  const seenQ = new Set<string>();
  const seenT = new Set<string>();

  function pushT(s: string): void {
    const t = s.trim();
    if (t.length < 2 || seenT.has(t)) return;
    seenT.add(t);
    out.push({ kind: "t", text: t });
  }

  function walk(node: unknown[], anc: unknown[][]): void {
    if (isOptGroup(node)) {
      const options = node.map(el => String(el[0]).trim());
      const imageUrl = findImageUrlInNode(anc[anc.length - 1]);
      for (let a = anc.length - 1; a >= 0; a--) {
        const strs = anc[a].filter(el => typeof el === "string") as string[];
        const clean = strs.map(s => s.trim())
          .filter(s => s.length >= 2 && !/^entry\./.test(s) && !options.includes(s));
        if (clean.length > 0) {
          const title = clean[0];
          const key = title + "||" + options.join("|");
          if (!seenQ.has(key)) { seenQ.add(key); out.push({ kind: "q", title, options, imageUrl }); }
          return;
        }
      }
      return;
    }
    for (const el of node) {
      if (typeof el === "string") pushT(el);
      else if (Array.isArray(el)) walk(el as unknown[], [...anc, node]);
    }
  }

  if (Array.isArray(json)) walk(json as unknown[], []);

  const cleaned: FormItem[] = [];
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    const nxt = out[i + 1];
    if (cur.kind === "t" && nxt && nxt.kind === "q" && nxt.title === cur.text) continue;
    cleaned.push(cur);
  }
  return cleaned;
}

const NOISE = /^(إرسال|محو( النموذج)?|التالي|الخلف|رجوع|الصفحة.*|Google|نماذج Google|نماذج|لم تنشئ هذا النموذج\?|الإبلاغ عن إساءة الاستخدام|شروط الاستخدام|سياسة الخصوصية|مطلوب|\*)$/i;

export function htmlToQuestionText(html: string): string {
  const t = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return t.split("\n").map(l => l.trim())
    .filter(l => l.length > 1 && !NOISE.test(l)).join("\n");
}

export function mineAnswerKeys(scoreHtml: string, questions: { title: string; options: string[] }[]): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<input type="hidden" name="entry\.[^"]+"[^>]*value="([^"]*)"/g;
  const hits: { idx: number; val: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(scoreHtml)) !== null) hits.push({ idx: m.index, val: m[1].trim() });
  if (hits.length === 0 || hits.length !== questions.length) return out;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const end = i + 1 < hits.length ? hits[i + 1].idx : scoreHtml.length;
    const seg = scoreHtml.slice(hits[i].idx, end);
    const ci = seg.indexOf("الإجابة الصحيحة");
    let text: string | null = null;
    if (ci >= 0) {
      const region = seg.slice(ci);
      const dv = region.match(/data-value="([^"]+)"/) || region.match(/aria-label="([^"]+)"/);
      if (dv) text = dv[1].trim();
    } else if (hits[i].val.length >= 2 && q.options.includes(hits[i].val)) {
      text = hits[i].val;
    }
    if (!text) continue;
    const li = q.options.indexOf(text);
    if (li >= 0 && li < ["أ", "ب", "ج", "د", "هـ"].length) {
      out[q.title] = ["أ", "ب", "ج", "د", "هـ"][li];
    }
  }
  return out;
}
