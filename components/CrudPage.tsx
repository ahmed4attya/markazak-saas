"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, RefreshCw, Save, X, Trash2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable";

export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

export type FilterOption = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
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
  filters?: FilterOption[];
  rowActions?: (row: any) => { label: string; onClick: () => void }[];
  deleteDialog?: (row: any) => { notice?: string; checkboxLabel?: string; checkboxParam?: string } | null;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  empty = "لا توجد بيانات",
  filters,
  rowActions,
  deleteDialog,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: CrudPageProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (filters) {
      for (const f of filters) {
        if (f.defaultValue) init[f.key] = f.defaultValue;
      }
    }
    return init;
  });
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [delRow, setDelRow] = useState<any>(null);
  const [delChecked, setDelChecked] = useState(false);

  // V4: Esc closes the open dialogs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (delRow) setDelRow(null);
      else if (modal) setModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [delRow, modal]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      for (const [k, v] of Object.entries(filterValues)) {
        if (v) sp.set(k, v);
      }
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      const url = endpoint + qs;
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
  }, [q, endpoint, filterValues]);

  const displayRows = useMemo(() => {
    return rows.filter((row) => {
      for (const [k, v] of Object.entries(filterValues)) {
        if (!v) continue;
        const rowVal = String(row?.[k] ?? "");
        if (rowVal.toLowerCase() !== v.toLowerCase()) return false;
      }
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const matchCol = columns.some((col) => {
          const val = row?.[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(needle);
        });
        if (matchCol) return true;
        const commonKeys = [
          "name",
          "student_no",
          "phone",
          "email",
          "identity_no",
          "title",
          "specialty",
          "category",
        ];
        return commonKeys.some(
          (k) => row?.[k] && String(row[k]).toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [rows, filterValues, q, columns]);

  const hasActiveFilters = Boolean(
    q.trim() || Object.values(filterValues).some((v) => Boolean(v))
  );

  function resetFilters() {
    setQ("");
    setFilterValues({});
  }

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
        toast.error(data?.error || "تعذر حفظ البيانات");
        return;
      }

      toast.success(editingId ? "تم حفظ التعديلات" : "تم الحفظ بنجاح");
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

    if (deleteDialog) {
      const spec = deleteDialog(row);
      if (spec) {
        setDelRow(row);
        setDelChecked(false);
        setError("");
        return;
      }
    }

    const name = row.name || row.student_no || title;

    if (!window.confirm(`هل تريد حذف ${name}؟`)) {
      return;
    }

    await doDelete(row, false);
  }

  async function doDelete(row: any, withCheckboxParam: boolean) {
    setDeleting(row.id);
    setError("");

    try {
      const spec = deleteDialog?.(row);
      const param = spec?.checkboxParam;
      const useParam = withCheckboxParam && param;
      const response = await fetch(`${endpoint}/${row.id}${useParam ? `?${param}=1` : ""}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "تعذر الحذف");
        toast.error(data?.error || "تعذر الحذف");
        return;
      }

      toast.success("تم الحذف");
      setDelRow(null);
      await load();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative group min-w-[200px] flex-1 sm:flex-initial">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث سريع..."
                className="bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            {filters?.map((filter) => (
              <div key={filter.key} className="min-w-[130px]">
                <select
                  value={filterValues[filter.key] || ""}
                  onChange={(e) =>
                    setFilterValues((prev) => ({
                      ...prev,
                      [filter.key]: e.target.value,
                    }))
                  }
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none w-full cursor-pointer"
                >
                  <option value="">{filter.label} (الكل)</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all cursor-pointer border border-red-200"
                title="إعادة ضبط وتفريغ كل الفلاتر والبحث"
              >
                <RotateCcw size={13} />
                <span>إعادة ضبط</span>
              </button>
            )}

            <button
              type="button"
              className="p-2 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => void load()}
              disabled={loading}
              title="تحديث البيانات"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <span className="text-[11px] font-bold text-slate-400 mr-auto sm:mr-0">
              عرض {displayRows.length} من {rows.length}
            </span>
          </div>

          {canCreate && (
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100 shrink-0 cursor-pointer"
              onClick={openCreate}
            >
              <Plus size={18} />
              إضافة جديد
            </button>
          )}
        </div>
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
        initialRows={displayRows}
        onAdd={canCreate ? openCreate : undefined}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? remove : undefined}
        extraActions={
          rowActions
            ? (row) => rowActions(row).map((a) => ({ ...a, onClick: () => { a.onClick(); } }))
            : undefined
        }
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
        {delRow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDelRow(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-slate-800">
                  تأكيد حذف {delRow.name || delRow.student_no || title}
                </h2>
                {deleteDialog?.(delRow)?.notice && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-6">
                    {deleteDialog(delRow)?.notice}
                  </p>
                )}
                {deleteDialog?.(delRow)?.checkboxLabel && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={delChecked}
                      onChange={(e) => setDelChecked(e.target.checked)}
                      className="w-4 h-4"
                    />
                    {deleteDialog(delRow)?.checkboxLabel}
                  </label>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDelRow(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={deleting === delRow.id}
                    onClick={() => void doDelete(delRow, delChecked)}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {deleting === delRow.id ? "جارٍ الحذف..." : "تأكيد الحذف"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
