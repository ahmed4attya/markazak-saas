'use client';

import Shell from '@/components/Shell';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Wallet,
  Receipt,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

type Student = {
  id: string;
  name: string;
  student_no?: string;
};

type Invoice = {
  id: string;
  number: string;
  student_id?: string;
  student_name?: string;
  amount: number | string;
  paid: number | string;
  due_date?: string | null;
  status: string;
  notes?: string;
};

const emptyInvoice = {
  amount: '',
  student_id: '',
  due_date: '',
  notes: '',
};

const emptyPayment = {
  invoice_id: '',
  amount: '',
  method: 'cash',
  reference: '',
};

export default function Finance() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState<any>({
    ...emptyInvoice,
  });

  const [paymentForm, setPaymentForm] = useState<any>({
    ...emptyPayment,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [invoiceRes, studentRes] = await Promise.all([
        fetch('/api/invoices', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ]);

      if (!invoiceRes.ok) {
        throw new Error('تعذر تحميل الفواتير');
      }

      if (!studentRes.ok) {
        throw new Error('تعذر تحميل الطلاب');
      }

      const invoiceData = await invoiceRes.json();
      const studentData = await studentRes.json();

      setRows(Array.isArray(invoiceData) ? invoiceData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const invoiced = rows.reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

    const paid = rows.reduce(
      (sum, x) => sum + Number(x.paid || 0),
      0
    );

    const remaining = Math.max(invoiced - paid, 0);

    const unpaid = rows.filter(
      (x) => x.status === 'unpaid'
    ).length;

    const partial = rows.filter(
      (x) => x.status === 'partial'
    ).length;

    const paidInvoices = rows.filter(
      (x) => x.status === 'paid'
    ).length;

    return {
      invoiced,
      paid,
      remaining,
      unpaid,
      partial,
      paidInvoices,
    };
  }, [rows]);

  const selectedPaymentInvoice = rows.find(
    (x) => x.id === paymentForm.invoice_id
  );

  const paymentRemaining = selectedPaymentInvoice
    ? Math.max(
        Number(selectedPaymentInvoice.amount || 0) -
          Number(selectedPaymentInvoice.paid || 0),
        0
      )
    : 0;

  function money(value: number | string) {
    return Number(value || 0).toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function openInvoice() {
    setError('');
    setMessage('');
    setInvoiceForm({ ...emptyInvoice });
    setInvoiceModal(true);
  }

  function openPayment(invoice: Invoice) {
    const remaining = Math.max(
      Number(invoice.amount || 0) -
        Number(invoice.paid || 0),
      0
    );

    if (remaining <= 0) {
      setError('هذه الفاتورة مدفوعة بالكامل');
      return;
    }

    setError('');
    setMessage('');

    setPaymentForm({
      ...emptyPayment,
      invoice_id: invoice.id,
      amount: remaining.toString(),
    });

    setPaymentModal(true);
  }

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();

    if (!invoiceForm.student_id) {
      setError('اختر الطالب');
      return;
    }

    if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) {
      setError('أدخل مبلغاً صحيحاً');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: invoiceForm.student_id,
          amount: Number(invoiceForm.amount),
          due_date: invoiceForm.due_date || null,
          notes: invoiceForm.notes || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'تعذر إصدار الفاتورة'
        );
      }

      setInvoiceModal(false);
      setInvoiceForm({ ...emptyInvoice });
      setMessage('تم إصدار الفاتورة بنجاح');

      await load();
    } catch (e: any) {
      setError(e.message || 'تعذر إصدار الفاتورة');
    } finally {
      setSaving(false);
    }
  }

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(paymentForm.amount || 0);

    if (!paymentForm.invoice_id) {
      setError('اختر الفاتورة');
      return;
    }

    if (amount <= 0) {
      setError('أدخل مبلغ دفعة صحيح');
      return;
    }

    if (amount > paymentRemaining) {
      setError(
        `المبلغ يتجاوز المتبقي. المتبقي ${money(
          paymentRemaining
        )} ر.س`
      );
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: paymentForm.invoice_id,
          amount,
          method: paymentForm.method || 'cash',
          reference: paymentForm.reference || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'تعذر تسجيل الدفعة'
        );
      }

      setPaymentModal(false);
      setPaymentForm({ ...emptyPayment });
      setMessage('تم تسجيل الدفعة وتحديث الفاتورة بنجاح');

      await load();
    } catch (e: any) {
      setError(e.message || 'تعذر تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell
      title="المالية"
      subtitle="الفواتير والتحصيل والمدفوعات"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="toolbar">
          <div className="financeSummary">
            <Wallet size={18} />
            إدارة مالية مركزك
          </div>

          <div className="flex gap-2">
            <button
              className="ghost"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={16} />
              تحديث
            </button>

            <button
              className="primary"
              onClick={openInvoice}
            >
              <Plus size={17} />
              إصدار فاتورة
            </button>
          </div>
        </div>

        <div className="financeCards">
          <div className="financeCard">
            <div className="text-sm text-gray-500">
              إجمالي الفواتير
            </div>
            <div className="mt-2 text-2xl font-bold">
              {money(totals.invoiced)} ر.س
            </div>
          </div>

          <div className="financeCard">
            <div className="text-sm text-gray-500">
              المحصل
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              {money(totals.paid)} ر.س
            </div>
          </div>

          <div className="financeCard">
            <div className="text-sm text-gray-500">
              المتبقي
            </div>
            <div className="mt-2 text-2xl font-bold text-red-600">
              {money(totals.remaining)} ر.س
            </div>
          </div>

          <div className="financeCard">
            <div className="text-sm text-gray-500">
              الفواتير
            </div>
            <div className="mt-2 text-2xl font-bold">
              {rows.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {totals.paidInvoices} مدفوعة ·{' '}
              {totals.partial} جزئية ·{' '}
              {totals.unpaid} غير مدفوعة
            </div>
          </div>
        </div>

        <div className="panel tablePanel">
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>الفاتورة</th>
                  <th>الطالب</th>
                  <th>المبلغ</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>الاستحقاق</th>
                  <th>الإجراء</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="tableEmpty"
                    >
                      جاري تحميل البيانات...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((x) => {
                    const amount = Number(x.amount || 0);
                    const paid = Number(x.paid || 0);
                    const remaining = Math.max(
                      amount - paid,
                      0
                    );

                    return (
                      <tr key={x.id}>
                        <td>
                          <b>{x.number}</b>
                        </td>

                        <td>
                          {x.student_name || '—'}
                        </td>

                        <td>
                          {money(amount)} ر.س
                        </td>

                        <td>
                          {money(paid)} ر.س
                        </td>

                        <td>
                          <b
                            className={
                              remaining > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {money(remaining)} ر.س
                          </b>
                        </td>

                        <td>
                          <span
                            className={`badge ${x.status}`}
                          >
                            {x.status === 'paid'
                              ? 'مدفوعة'
                              : x.status === 'partial'
                                ? 'جزئياً'
                                : 'غير مدفوعة'}
                          </span>
                        </td>

                        <td>
                          {x.due_date || '—'}
                        </td>

                        <td>
                          {remaining > 0 ? (
                            <button
                              className="ghost"
                              onClick={() =>
                                openPayment(x)
                              }
                            >
                              <CreditCard size={15} />
                              تسجيل دفعة
                            </button>
                          ) : (
                            <span className="text-sm text-green-600">
                              مكتملة
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="tableEmpty"
                    >
                      لا توجد فواتير
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {invoiceModal && (
          <div className="modalBack">
            <form
              className="modal"
              onSubmit={saveInvoice}
            >
              <div className="modalHead">
                <h2>إصدار فاتورة</h2>

                <button
                  type="button"
                  onClick={() =>
                    setInvoiceModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="formGrid">
                <label>
                  الطالب
                  <select
                    required
                    value={invoiceForm.student_id}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        student_id: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      اختر الطالب
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.name}
                        {student.student_no
                          ? ` — ${student.student_no}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  المبلغ
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={invoiceForm.amount}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  تاريخ الاستحقاق
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        due_date: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  ملاحظات
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </label>

                <div className="modalActions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setInvoiceModal(false)
                    }
                  >
                    إلغاء
                  </button>

                  <button
                    className="primary"
                    disabled={saving}
                  >
                    <Receipt size={16} />
                    {saving
                      ? 'جاري الحفظ...'
                      : 'إصدار الفاتورة'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {paymentModal && (
          <div className="modalBack">
            <form
              className="modal"
              onSubmit={savePayment}
            >
              <div className="modalHead">
                <h2>تسجيل دفعة</h2>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="formGrid">
                <label>
                  الفاتورة
                  <select
                    required
                    value={paymentForm.invoice_id}
                    onChange={(e) => {
                      const invoice = rows.find(
                        (x) =>
                          x.id === e.target.value
                      );

                      const remaining = invoice
                        ? Math.max(
                            Number(invoice.amount || 0) -
                              Number(invoice.paid || 0),
                            0
                          )
                        : 0;

                      setPaymentForm({
                        ...paymentForm,
                        invoice_id:
                          e.target.value,
                        amount:
                          remaining > 0
                            ? remaining.toString()
                            : '',
                      });
                    }}
                  >
                    <option value="">
                      اختر الفاتورة
                    </option>

                    {rows
                      .filter(
                        (x) =>
                          Number(x.amount || 0) >
                          Number(x.paid || 0)
                      )
                      .map((invoice) => (
                        <option
                          key={invoice.id}
                          value={invoice.id}
                        >
                          {invoice.number} —{' '}
                          {invoice.student_name ||
                            'بدون طالب'}
                        </option>
                      ))}
                  </select>
                </label>

                {selectedPaymentInvoice && (
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span>قيمة الفاتورة</span>
                      <b>
                        {money(
                          selectedPaymentInvoice.amount
                        )}{' '}
                        ر.س
                      </b>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span>المدفوع</span>
                      <b>
                        {money(
                          selectedPaymentInvoice.paid
                        )}{' '}
                        ر.س
                      </b>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span>المتبقي</span>
                      <b className="text-red-600">
                        {money(paymentRemaining)} ر.س
                      </b>
                    </div>
                  </div>
                )}

                <label>
                  مبلغ الدفعة
                  <input
                    required
                    min="0.01"
                    max={paymentRemaining || undefined}
                    step="0.01"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  طريقة الدفع
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        method: e.target.value,
                      })
                    }
                  >
                    <option value="cash">
                      نقدي
                    </option>
                    <option value="bank">
                      تحويل بنكي
                    </option>
                    <option value="card">
                      بطاقة
                    </option>
                    <option value="online">
                      دفع إلكتروني
                    </option>
                  </select>
                </label>

                <label>
                  المرجع
                  <input
                    value={paymentForm.reference}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        reference: e.target.value,
                      })
                    }
                    placeholder="رقم العملية أو المرجع"
                  />
                </label>

                <div className="modalActions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setPaymentModal(false)
                    }
                  >
                    إلغاء
                  </button>

                  <button
                    className="primary"
                    disabled={
                      saving ||
                      !selectedPaymentInvoice ||
                      paymentRemaining <= 0
                    }
                  >
                    <CreditCard size={16} />
                    {saving
                      ? 'جاري الحفظ...'
                      : 'تسجيل الدفعة'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}