"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DataTableColumn = {
  key: string;
  label: string;
};

type DataTableProps = {
  title: string;
  columns: DataTableColumn[];
  initialRows: Record<string, any>[];
  onAdd?: () => void;
  renderCell?: (
    value: any,
    column: DataTableColumn,
    row: Record<string, any>,
    index: number,
  ) => React.ReactNode;
  onEdit?: (row: Record<string, any>) => void;
  onDelete?: (row: Record<string, any>) => void;
};

export default function DataTable({
  title,
  columns,
  initialRows,
  onAdd,
  renderCell,
  onEdit,
  onDelete,
}: DataTableProps) {
  const [query, setQuery] = useState("");
  const [menuRow, setMenuRow] = useState<number | null>(null);

  const rows = Array.isArray(initialRows) ? initialRows : [];

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return rows;

    return rows.filter((row) =>
      Object.values(row || {})
        .map((item) => String(item ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [rows, query]);

  return (
    <div className="bento-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>

          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-extrabold text-slate-600">
            {rows.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="بحث..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 sm:w-56"
            />
          </div>

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus size={16} />
              إضافة جديد
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-right">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500">
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-6 py-4">
                  {column.label}
                </th>
              ))}

              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-center">الإجراءات</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {filteredRows.map((row, rowIndex) => (
                <motion.tr
                  key={row.id ?? rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {columns.map((column, columnIndex) => {
                    const value = row?.[column.key];

                    return (
                      <td
                        key={column.key}
                        className="whitespace-nowrap px-6 py-4 text-sm text-slate-700"
                      >
                        {renderCell
                          ? renderCell(value, column, row, columnIndex)
                          : (value ?? "—")}
                      </td>
                    );
                  })}

                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-flex">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                          onClick={() =>
                            setMenuRow(menuRow === rowIndex ? null : rowIndex)
                          }
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuRow === rowIndex && (
                          <div className="absolute left-0 top-11 z-20 min-w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-right shadow-xl">
                            {onEdit && (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setMenuRow(null);
                                  onEdit(row);
                                }}
                              >
                                <Edit3 size={14} />
                                تعديل
                              </button>
                            )}

                            {onDelete && (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setMenuRow(null);
                                  onDelete(row);
                                }}
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {!filteredRows.length && (
          <div className="flex min-h-44 items-center justify-center p-8 text-sm font-semibold text-slate-400">
            {query ? "لا توجد نتائج مطابقة للبحث" : "لا توجد بيانات حتى الآن"}
          </div>
        )}
      </div>
    </div>
  );
}
