'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Save,
  X,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from 'lucide-react';

export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

type Column = {
  key: string;
  label: string;
};

type CrudPageProps = {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: Column[];
  fields: Field[];
  empty?: string;
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  graduated: 'متخرج',
  suspended: 'موقوف',
  draft: 'مسودة',
  archived: 'مؤرشف',
  scheduled: 'مجدولة',
  completed: 'مكتملة',
};

function statusLabel(status: string) {
  return statusLabels[status] || status || '—';
}

function statusClass(status: string) {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'inactive':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    case 'graduated':
    case 'completed':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'suspended':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'scheduled':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  empty = 'لا توجد بيانات',
}: CrudPageProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const url = endpoint + (q ? `?q=${encodeURIComponent(q)}` : '');

      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'تعذر تحميل البيانات');
        setRows([]);
        return;
      }

      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [q]);

  function setField(key: string, value: any) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({});
    setError('');
    setModal(true);
  }

  function openEdit(row: any) {
    const next: Record<string, any> = {};

    for (const field of fields) {
      next[field.key] = row[field.key] ?? '';
    }

    setEditingId(row.id);
    setForm(next);
    setError('');
    setModal(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        editingId ? `${endpoint}/${editingId}` : endpoint,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'تعذر حفظ البيانات');
        return;
      }

      setModal(false);
      setForm({});
      setEditingId(null);

      await load();
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: any) {
    if (!row?.id || deleting) return;

    const name =
      row.name ||
      row.number ||
      row.student_no ||
      row.email ||
      title;

    if (!window.confirm(`هل تريد حذف ${name}؟`)) {
      return;
    }

    setDeleting(row.id);
    setError('');

    try {
      const response = await fetch(`${endpoint}/${row.id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'تعذر الحذف');
        return;
      }

      await load();
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setDeleting(null);
    }
  }

  const stats = useMemo(() => {
    const total = rows.length;

    const active = rows.filter(
      (row) => row.status === 'active'
    ).length;

    const inactive = rows.filter(
      (row) => row.status === 'inactive'
    ).length;

    const completed = rows.filter(
      (row) =>
        row.status === 'graduated' ||
        row.status === 'completed'
    ).length;

    return {
      total,
      active,
      inactive,
      completed,
    };
  }, [rows]);

  const statCards = [
    {
      title: 'إجمالي السجلات',
      value: stats.total,
      description: `جميع ${title}`,
      icon: Users,
      className: 'border-slate-200 bg-white',
      iconClass: 'bg-slate-100 text-slate-700',
    },
    {
      title: 'نشط',
      value: stats.active,
      description: `${title} النشطون حاليًا`,
      icon: CheckCircle2,
      className: 'border-emerald-200 bg-emerald-50/70',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'غير نشط',
      value: stats.inactive,
      description: `${title} غير النشطين`,
      icon: XCircle,
      className: 'border-slate-200 bg-slate-50',
      iconClass: 'bg-slate-200 text-slate-600',
    },
    {
      title: 'مكتمل / متخرج',
      value: stats.completed,
      description: `${title} المكتملون`,
      icon: GraduationCap,
      className: 'border-blue-200 bg-blue-50/70',
      iconClass: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={`بحث في ${title}...`}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div className="flex w-full gap-2 lg:w-auto">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            تحديث
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 lg:flex-none"
          >
            <Plus size={17} />
            إضافة {title}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-right">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-600"
                  >
                    {column.label}
                  </th>
                ))}

                <th className="px-5 py-4 text-center text-xs font-bold text-slate-600">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="transition hover:bg-slate-50/70"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-5 py-4 text-sm text-slate-700"
                      >
                        {column.key === 'status' ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              row[column.key]
                            )}`}
                          >
                            {statusLabel(row[column.key])}
                          </span>
                        ) : (
                          row[column.key] ?? '—'
                        )}
                      </td>
                    ))}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          title="تعديل"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(row)}
                          disabled={deleting === row.id}
                          title="حذف"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              جاري تحميل البيانات...
            </div>
          ) : rows.length ? (
            rows.map((row, index) => (
              <div
                key={row.id || index}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-xs font-medium text-slate-500">
                        {column.label}
                      </span>

                      <div className="text-left text-sm font-semibold text-slate-800">
                        {column.key === 'status' ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              row[column.key]
                            )}`}
                          >
                            {statusLabel(row[column.key])}
                          </span>
                        ) : (
                          row[column.key] ?? '—'
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"
                    >
                      <Pencil size={14} />
                      تعديل
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={deleting === row.id}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              {empty}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? `تعديل ${title}` : `إضافة ${title}`}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {subtitle || 'أدخل البيانات الأساسية'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={save} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label
                  key={field.key}
                  className={
                    field.type === 'textarea'
                      ? 'sm:col-span-2'
                      : ''
                  }
                >
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    {field.label}
                    {field.required && (
                      <span className="mr-1 text-red-500">*</span>
                    )}
                  </span>

                  {field.type === 'select' ? (
                    <select
                      value={form[field.key] ?? ''}
                      onChange={(event) =>
                        setField(field.key, event.target.value)
                      }
                      required={field.required}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="">اختر...</option>

                      {field.options?.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={form[field.key] ?? ''}
                      onChange={(event) =>
                        setField(field.key, event.target.value)
                      }
                      required={field.required}
                      className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={form[field.key] ?? ''}
                      onChange={(event) =>
                        setField(field.key, event.target.value)
                      }
                      required={field.required}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  )}
                </label>
              ))}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />

                  {saving
                    ? 'جاري الحفظ...'
                    : editingId
                      ? 'حفظ التعديلات'
                      : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
