export type GFormQ = { title: string; options: string[] };

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

export function mineQuestions(json: unknown): GFormQ[] {
  const out: GFormQ[] = [];
  const seen = new Set<string>();
  function walk(node: unknown[], anc: unknown[][]): void {
    if (isOptGroup(node)) {
      const options = node.map(el => String(el[0]).trim());
      for (let a = anc.length - 1; a >= 0; a--) {
        const strings = anc[a].filter(el =>
          typeof el === "string" && (el as string).trim().length >= 6 && (el as string).trim().length <= 400) as string[];
        const title = strings.find(t => !options.includes(t.trim()) && !/^entry\./.test(t));
        if (title) {
          const key = title + "||" + options.join("|");
          if (!seen.has(key)) { seen.add(key); out.push({ title: title.trim(), options }); }
          break;
        }
      }
    }
    for (const child of node) if (Array.isArray(child)) walk(child, [...anc, node]);
  }
  if (Array.isArray(json)) walk(json, []);
  return out;
}

export function htmlToQuestionText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ");
}
