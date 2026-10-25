export type FormQ = { title: string; options: string[] };

export function unescapeJsString(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== "\\" || i + 1 >= s.length) { out += ch; continue; }
    const n = s[++i];
    switch (n) {
      case "n": out += "\n"; break;
      case "t": out += "\t"; break;
      case "r": out += "\r"; break;
      case "b": out += "\b"; break;
      case "f": out += "\f"; break;
      case "v": out += "\v"; break;
      case "u": {
        const hex = s.slice(i + 1, i + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) { out += String.fromCharCode(parseInt(hex, 16)); i += 4; }
        else out += "u";
        break;
      }
      case "x": {
        const hex = s.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) { out += String.fromCharCode(parseInt(hex, 16)); i += 2; }
        else out += "x";
        break;
      }
      default: out += n; break;
    }
  }
  return out;
}

export function extractMsFormNode(html: string): Record<string, unknown> | null {
  const re = /JSON\.parse\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const lit = m[1] ?? m[2];
    if (!lit || lit.length < 20) continue;
    let data: unknown;
    try { data = JSON.parse(unescapeJsString(lit)); } catch { continue; }
    const form = findFormNode(data, 0);
    if (form) return form;
  }
  return null;
}

function findFormNode(data: unknown, depth: number): Record<string, unknown> | null {
  if (depth > 6 || !data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const el of data) { const f = findFormNode(el, depth + 1); if (f) return f; }
    return null;
  }
  const o = data as Record<string, unknown>;
  const qs = o.questions;
  if (Array.isArray(qs) && qs.length > 0 && typeof qs[0] === "object" && qs[0] !== null) return o;
  for (const v of Object.values(o)) {
    const f = findFormNode(v, depth + 1);
    if (f) return f;
  }
  return null;
}

function textOf(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) { for (const el of v) { const t = textOf(el); if (t) return t; } return ""; }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.Text === "string") return o.Text.trim();
    if (typeof o.text === "string") return o.text.trim();
    if (o.OptionText) return textOf(o.OptionText);
    if (o.QuestionTitle) return textOf(o.QuestionTitle);
    if (o.description) return textOf(o.description);
  }
  return "";
}

export function mineMsForm(form: Record<string, unknown>): FormQ[] {
  const out: FormQ[] = [];
  const seen = new Set<string>();
  const qs = Array.isArray(form.questions) ? (form.questions as unknown[]) : [];
  for (const q of qs) {
    if (!q || typeof q !== "object") continue;
    const o = q as Record<string, unknown>;
    let options: string[] = [];
    const choice = (o.Choice ?? o.choice) as Record<string, unknown> | undefined;
    const optsRaw = choice?.Options ?? choice?.options ?? o.Options ?? o.options;
    if (Array.isArray(optsRaw)) options = (optsRaw as unknown[]).map(textOf);
    options = options.filter(t => t.length > 0 && t.length <= 200);
    let title = "";
    if (o.QuestionTitle || o.questionTitle) title = textOf(o.QuestionTitle ?? o.questionTitle);
    if (!title) title = textOf(o.description ?? o.Description);
    title = title.trim();
    if (options.length >= 2 && title.length >= 5 && title.length <= 2000 && !options.includes(title)) {
      const key = title + "||" + options.join("|");
      if (!seen.has(key)) { seen.add(key); out.push({ title, options }); }
    }
  }
  return out;
}
