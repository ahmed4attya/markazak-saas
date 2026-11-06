import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { id: courseId } = await params;

    const [courseRes, tenantRes, modulesRes, lessonsRes] = await Promise.all([
      query(
        `select c.*,
                coalesce((select string_agg(u.name, '، ') from course_teachers ct join users u on u.id = ct.teacher_user_id where ct.course_id = c.id), '') as teacher_names
         from courses c
         where c.id = $1 and c.tenant_id = $2`,
        [courseId, s.tenantId]
      ),
      query('select id, name, logo_url, currency from tenants where id = $1', [s.tenantId]),
      query(
        'select * from modules where course_id = $1 and tenant_id = $2 order by sort_order asc, created_at asc',
        [courseId, s.tenantId]
      ),
      query(
        'select * from lessons where course_id = $1 and tenant_id = $2 order by sort_order asc, created_at asc',
        [courseId, s.tenantId]
      ),
    ]);

    if (!courseRes.rows.length) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    const course = courseRes.rows[0];
    const tenant = tenantRes.rows[0] || { name: 'مركز التدريب' };

    const lessonsByModule: Record<string, any[]> = {};
    for (const l of lessonsRes.rows) {
      const mid = String(l.module_id);
      if (!lessonsByModule[mid]) lessonsByModule[mid] = [];
      lessonsByModule[mid].push(l);
    }

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>خطة المنهج - ${escapeHtml(course.name)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .center-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .syllabus-badge {
      background: #f1f5f9;
      color: #334155;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
    }
    .course-title {
      font-size: 26px;
      font-weight: 800;
      color: #090d16;
      margin: 0 0 8px 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .meta-item label {
      display: block;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .meta-item span {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-right: 4px solid #2563eb;
      padding-right: 10px;
      margin: 24px 0 12px 0;
    }
    .description-box {
      font-size: 14px;
      color: #334155;
      background: #fff;
      padding: 12px 0;
      border-bottom: 1px dashed #cbd5e1;
      margin-bottom: 20px;
    }
    .module-card {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .module-header {
      background: #f1f5f9;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 15px;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
    }
    .module-desc {
      padding: 8px 16px;
      font-size: 12px;
      color: #64748b;
      background: #fafafa;
      border-bottom: 1px solid #f1f5f9;
    }
    .lessons-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .lessons-table th {
      background: #fff;
      color: #64748b;
      padding: 8px 16px;
      text-align: right;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }
    .lessons-table td {
      padding: 10px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .lessons-table tr:last-child td {
      border-bottom: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
    }
    .no-print {
      margin-bottom: 20px;
      background: #dbeafe;
      border: 1px solid #93c5fd;
      padding: 12px 18px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #2563eb;
      color: #fff;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span>خطة المنهج جاهزة للطباعة أو الحفظ كملف PDF.</span>
    <button class="btn-print" onclick="window.print()">طباعة / حفظ PDF</button>
  </div>

  <div class="header">
    <div class="center-title">${escapeHtml(tenant.name)}</div>
    <div class="syllabus-badge">خطة المنهج الأكاديمي</div>
  </div>

  <h1 class="course-title">${escapeHtml(course.name)}</h1>

  <div class="meta-grid">
    <div class="meta-item">
      <label>كود الدورة</label>
      <span>${escapeHtml(course.code || '—')}</span>
    </div>
    <div class="meta-item">
      <label>التصنيف</label>
      <span>${escapeHtml(course.category || 'عام')}</span>
    </div>
    <div class="meta-item">
      <label>المدة الإجمالية</label>
      <span>${course.duration_hours || 0} ساعة تدريبية</span>
    </div>
    <div class="meta-item">
      <label>المدربون</label>
      <span>${escapeHtml(course.teacher_names || 'فريق التدريب')}</span>
    </div>
  </div>

  ${course.description ? `
  <div class="section-title">نبذة عن الدورة</div>
  <div class="description-box">${escapeHtml(course.description)}</div>
  ` : ''}

  <div class="section-title">الوحدات والدروس التفصيلية (${modulesRes.rows.length} وحدة · ${lessonsRes.rows.length} درس)</div>

  ${modulesRes.rows.length === 0 ? `
    <div style="text-align: center; padding: 40px; color: #64748b; background: #f8fafc; border-radius: 8px;">
      لم تتم إضافة وحدات أو دروس لهذه الدورة بعد.
    </div>
  ` : modulesRes.rows.map((m: any, idx: number) => {
    const mLessons = lessonsByModule[String(m.id)] || [];
    return `
    <div class="module-card">
      <div class="module-header">
        <span>الوحدة ${idx + 1}: ${escapeHtml(m.title)}</span>
        <span style="font-size: 12px; font-weight: normal; color: #64748b;">${mLessons.length} درس</span>
      </div>
      ${m.description ? `<div class="module-desc">${escapeHtml(m.description)}</div>` : ''}
      ${mLessons.length > 0 ? `
      <table class="lessons-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>عنوان الدرس</th>
            <th style="width: 120px;">المدة</th>
            <th style="width: 120px;">النوع</th>
          </tr>
        </thead>
        <tbody>
          ${mLessons.map((l: any, lIdx: number) => `
          <tr>
            <td>${lIdx + 1}</td>
            <td><strong>${escapeHtml(l.title)}</strong></td>
            <td>${l.duration_minutes ? l.duration_minutes + ' دقيقة' : '—'}</td>
            <td>${l.video_url ? 'فيديو تدريبي' : 'نصي / ملخص'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : `
      <div style="padding: 12px 16px; font-size: 13px; color: #94a3b8;">لا توجد دروس مضافة في هذه الوحدة بعد.</div>
      `}
    </div>
    `;
  }).join('')}

  <div class="footer">
    <span>تم إنشاء هذه الوثيقة تلقائياً بواسطة منصة مركزك</span>
    <span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</span>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر توليد خطة المنهج' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
