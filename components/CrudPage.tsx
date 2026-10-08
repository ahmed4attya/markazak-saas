"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DataTable from "@/components/DataTable";

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

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  empty = "لا توجد بيانات",
}: CrudPageProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const url = endpoint + (q ? `?q=${encodeURIComponent(q)}` : "");
      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        setRows([]);
        setError("تعذر تحميل البيانات");
        return;
      }

      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, endpoint]);

  function setField(key: string, value: any) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({});
    setError("");
    setModal(true);
  }

  function openEdit(row: any) {
    const next: Record<string, any> = {};

    for (const field of fields) {
      next[field.key] = row?.[field.key] ?? "";
    }

    setEditingId(row?.id ?? null);
    setForm(next);
    setError("");
    setModal(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "تعذر حفظ البيانات");
        return;
      }

      setModal(false);
      setForm({});
      setEditingId(null);

      await load();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: any) {
    if (!row?.id || deleting) return;

    const name = row.name || row.student_no || title;

    if (!window.confirm(`هل تريد حذف ${name}؟`)) {
      return;
    }

    setDeleting(row.id);
    setError("");

    try {
      const response = await fetch(`${endpoint}/${row.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "تعذر الحذف");
        return;
      }

      await load();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث سريع..."
              className="bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm w-full sm:w-72 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <button
            type="button"
            className="p-2 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            onClick={() => void load()}
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100"
          onClick={openCreate}
        >
          <Plus size={18} />
          إضافة جديد
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-red-50 border-r-[3px] border-r-[color:var(--gold)]/60 border-red-500 text-red-700 text-sm rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <DataTable
        title={title}
        columns={columns}
        initialRows={rows}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={remove}
        renderCell={(value, column) => {
          if (column?.key === "status") {
            return <Badge value={value} />;
          }

          return (
            <span>
              {value === null || value === undefined || value === ""
                ? "—"
                : String(value)}
            </span>
          );
        }}
      />

      {rows.length === 0 && !loading && !error && (
        <div className="text-center text-sm text-slate-400 py-4">{empty}</div>
      )}

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingId ? `تعديل ${title}` : `إضافة ${title}`}
                  </h2>

                  <p className="text-slate-500 text-xs mt-1">
                    {subtitle || "يرجى إكمال البيانات المطلوبة أدناه"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={save} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className={`flex flex-col gap-1.5 ${
                        field.type === "textarea" ? "md:col-span-2" : ""
                      }`}
                    >
                      <label className="text-xs font-bold text-slate-600 mr-1">
                        {field.label}

                        {field.required && (
                          <span className="text-red-500 mr-1">*</span>
                        )}
                      </label>

                      {field.type === "select" ? (
                        <select
                          value={form[field.key] ?? ""}
                          onChange={(e) => setField(field.key, e.target.value)}
                          required={field.required}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">اختر...</option>

                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={form[field.key] ?? ""}
                          onChange={(e) => setField(field.key, e.target.value)}
                          required={field.required}
                          rows={3}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={form[field.key] ?? ""}
                          onChange={(e) => setField(field.key, e.target.value)}
                          required={field.required}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    <Save size={16} />

                    {saving
                      ? "جارٍ الحفظ..."
                      : editingId
                        ? "حفظ التعديلات"
                        : "حفظ البيانات"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ value }: { value: any }) {
  if (typeof value !== "string") {
    return <span className="font-medium">{value ?? "—"}</span>;
  }

  const labels: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    graduated: "متخرج",
    suspended: "موقوف",
    pending: "معلق",
    completed: "مكتمل",
    cancelled: "ملغي",
  };

  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-red-100 text-red-700 border-red-200",
    graduated: "bg-blue-100 text-blue-700 border-blue-200",
    suspended: "bg-slate-100 text-slate-700 border-slate-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const key = value.toLowerCase();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${
        styles[key] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {labels[key] || value}
    </span>
  );
}
