export type ImportedQuestion = {
  row: number;
  courseId: string | null;
  domain: string;
  subject: string | null;
  topic: string | null;
  skill: string | null;
  difficulty: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  status: 'READY' | 'DISABLED';
  issues: string[];
};

const domains = new Set(['quant', 'verbal', 'achievement']);

function splitCsvLine(line: string): string[] {
  const cells: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i++; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { cells.push(cell.trim()); cell = ''; continue; }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseQuestionCsv(csv: string): ImportedQuestion[] {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, offset) => {
    const cells = splitCsvLine(line); const value = (name: string) => cells[headers.indexOf(name)] || '';
    const issues: string[] = []; const domain = value('domain'); const text = value('text');
    const options = value('options').split('|').map((item) => item.trim()).filter(Boolean);
    const correctIndex = Number(value('correctIndex')); const difficulty = Number(value('difficulty') || 3);
    if (!domains.has(domain)) issues.push('domain غير صالح');
    if (!text) issues.push('نص السؤال مفقود');
    if (options.length < 2 || options.length > 6) issues.push('عدد الخيارات يجب أن يكون بين 2 و6');
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) issues.push('correctIndex غير صالح');
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) issues.push('difficulty يجب أن يكون بين 1 و5');
    return { row: offset + 2, courseId: value('courseId') || null, domain, subject: value('subject') || null, topic: value('topic') || null, skill: value('skill') || null, difficulty: Number.isInteger(difficulty) ? difficulty : 3, text, options, correctIndex, explanation: value('explanation') || null, status: issues.length ? 'DISABLED' : 'READY', issues };
  });
}
