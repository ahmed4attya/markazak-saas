'use client';

import { useEffect, useMemo, useState } from 'react';
import Shell from '../../components/Shell';

type Group = {
  id: string;
  name: string;
  course_name?: string;
  teacher_name?: string;
  student_count?: number;
};

type Enrollment = {
  id: string;
  group_id: string;
  student_id: string;
  status: string;
  student_name?: string;
  student_no?: string;
  group_name?: string;
};

type Attendance = {
  id: string;
  group_id: string;
  student_id: string;
  attendance_date: string;
  status: string;
  check_in?: string | null;
  notes?: string;
  student_name?: string;
  student_no?: string;
  group_name?: string;
};

const STATUS_LABELS: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'معذور',
};

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [groupsRes, enrollmentsRes, attendanceRes] =
        await Promise.all([
          fetch('/api/groups', { cache: 'no-store' }),
          fetch('/api/enrollments', { cache: 'no-store' }),
          fetch('/api/attendance', { cache: 'no-store' }),
        ]);

      if (!groupsRes.ok) {
        throw new Error('تعذر تحميل المجموعات');
      }

      if (!enrollmentsRes.ok) {
        throw new Error('تعذر تحميل التسجيلات');
      }

      if (!attendanceRes.ok) {
        throw new Error('تعذر تحميل الحضور');
      }

      const groupsData = await groupsRes.json();
      const enrollmentsData = await enrollmentsRes.json();
      const attendanceData = await attendanceRes.json();

      const nextGroups: Group[] = Array.isArray(groupsData)
        ? groupsData
        : [];

      setGroups(nextGroups);

      setEnrollments(
        Array.isArray(enrollmentsData)
          ? enrollmentsData
          : []
      );

      setAttendance(
        Array.isArray(attendanceData)
          ? attendanceData
          : []
      );

      setGroupId((current) => {
        if (
          current &&
          nextGroups.some((group) => group.id === current)
        ) {
          return current;
        }

        return nextGroups[0]?.id || '';
      });
    } catch (e: any) {
      setError(
        e?.message || 'حدث خطأ أثناء تحميل البيانات'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeEnrollments = useMemo(() => {
    return enrollments.filter(
      (enrollment) =>
        enrollment.group_id === groupId &&
        ['active', 'completed'].includes(
          enrollment.status
        )
    );
  }, [enrollments, groupId]);

  const existingForDate = useMemo(() => {
    const map: Record<string, Attendance> = {};

    attendance
      .filter(
        (item) =>
          item.group_id === groupId &&
          String(item.attendance_date).slice(0, 10) === date
      )
      .forEach((item) => {
        map[item.student_id] = item;
      });

    return map;
  }, [attendance, groupId, date]);

  useEffect(() => {
    const nextStatuses: Record<string, string> = {};
    const nextNotes: Record<string, string> = {};

    activeEnrollments.forEach((enrollment) => {
      const studentId = enrollment.student_id;
      const existing = existingForDate[studentId];

      nextStatuses[studentId] =
        existing?.status ||
        statuses[studentId] ||
        'present';

      nextNotes[studentId] =
        existing?.notes ||
        notes[studentId] ||
        '';
    });

    setStatuses(nextStatuses);
    setNotes(nextNotes);
  }, [
    groupId,
    date,
    activeEnrollments,
    existingForDate,
  ]);

  function setStatus(
    studentId: string,
    status: string
  ) {
    setStatuses((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  }

  async function saveAttendance(
    enrollment: Enrollment
  ) {
    const studentId = enrollment.student_id;
    const existing = existingForDate[studentId];

    setSaving(studentId);
    setMessage('');
    setError('');

    try {
      const payload = {
        attendance_date: date,
        status: statuses[studentId] || 'present',
        notes: notes[studentId] || '',
      };

      const response = await fetch(
        existing
          ? `/api/attendance/${existing.id}`
          : '/api/attendance',
        {
          method: existing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            existing
              ? payload
              : {
                  ...payload,
                  group_id: groupId,
                  student_id: studentId,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'تعذر حفظ الحضور'
        );
      }

      setMessage(
        existing
          ? 'تم تحديث سجل الحضور بنجاح'
          : 'تم تسجيل الحضور بنجاح'
      );

      await loadData();
    } catch (e: any) {
      setError(
        e?.message || 'حدث خطأ أثناء الحفظ'
      );
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    if (!groupId) {
      setError('اختر المجموعة أولاً');
      return;
    }

    if (activeEnrollments.length === 0) {
      setError('لا يوجد طلاب مسجلون في هذه المجموعة');
      return;
    }

    setSaving('all');
    setMessage('');
    setError('');

    try {
      for (const enrollment of activeEnrollments) {
        const studentId = enrollment.student_id;
        const existing = existingForDate[studentId];

        const payload = {
          attendance_date: date,
          status: statuses[studentId] || 'present',
          notes: notes[studentId] || '',
        };

        const response = await fetch(
          existing
            ? `/api/attendance/${existing.id}`
            : '/api/attendance',
          {
            method: existing ? 'PATCH' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              existing
                ? payload
                : {
                    ...payload,
                    group_id: groupId,
                    student_id: studentId,
                  }
            ),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              `تعذر حفظ حضور ${
                enrollment.student_name || studentId
              }`
          );
        }
      }

      await loadData();

      setMessage(
        'تم حفظ حضور جميع الطلاب بنجاح'
      );
    } catch (e: any) {
      setError(
        e?.message || 'تعذر حفظ الحضور'
      );
    } finally {
      setSaving(null);
    }
  }

  const selectedGroup = groups.find(
    (group) => group.id === groupId
  );

  const summary = {
    present: activeEnrollments.filter(
      (enrollment) =>
        statuses[enrollment.student_id] === 'present'
    ).length,

    absent: activeEnrollments.filter(
      (enrollment) =>
        statuses[enrollment.student_id] === 'absent'
    ).length,

    late: activeEnrollments.filter(
      (enrollment) =>
        statuses[enrollment.student_id] === 'late'
    ).length,

    excused: activeEnrollments.filter(
      (enrollment) =>
        statuses[enrollment.student_id] === 'excused'
    ).length,
  };

  return (
    <Shell
      title="الحضور والانصراف"
      subtitle="تسجيل ومتابعة حضور الطلاب حسب المجموعة والتاريخ"
    >
      <main
        className="space-y-6"
        dir="rtl"
      >
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

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium">
                المجموعة
              </label>

              <select
                value={groupId}
                onChange={(event) => {
                  setGroupId(event.target.value);
                  setMessage('');
                  setError('');
                }}
                disabled={
                  loading || groups.length === 0
                }
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loading
                    ? 'جاري تحميل المجموعات...'
                    : 'اختر المجموعة'}
                </option>

                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                    {group.course_name
                      ? ` — ${group.course_name}`
                      : ''}
                    {typeof group.student_count ===
                    'number'
                      ? ` (${group.student_count} طالب)`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                التاريخ
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setMessage('');
                  setError('');
                }}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={saveAll}
                disabled={
                  !groupId ||
                  saving === 'all' ||
                  activeEnrollments.length === 0
                }
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving === 'all'
                  ? 'جاري الحفظ...'
                  : 'حفظ حضور المجموعة'}
              </button>
            </div>

          </div>
        </section>

        {selectedGroup && (
          <section className="attendanceSummary">
            <div className="attendanceCard present">
              <span>حاضر</span><strong>{summary.present}</strong><small>طالب</small>
            </div>
            <div className="attendanceCard absent">
              <span>غائب</span><strong>{summary.absent}</strong><small>طالب</small>
            </div>
            <div className="attendanceCard late">
              <span>متأخر</span><strong>{summary.late}</strong><small>طالب</small>
            </div>
            <div className="attendanceCard excused">
              <span>معذور</span><strong>{summary.excused}</strong><small>طالب</small>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {!groupId ? (
            <div className="p-10 text-center text-gray-500">
              اختر مجموعة لعرض الطلاب المسجلين
            </div>

          ) : loading ? (
            <div className="p-10 text-center text-gray-500">
              جاري تحميل البيانات...
            </div>

          ) : activeEnrollments.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              لا يوجد طلاب مسجلون في هذه المجموعة
            </div>

          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-right">

                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-4">
                      الطالب
                    </th>

                    <th className="px-4 py-4">
                      رقم الطالب
                    </th>

                    <th className="px-4 py-4">
                      الحالة
                    </th>

                    <th className="px-4 py-4">
                      ملاحظات
                    </th>

                    <th className="px-4 py-4">
                      الحفظ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">

                  {activeEnrollments.map(
                    (enrollment) => {
                      const studentId =
                        enrollment.student_id;

                      const existing =
                        existingForDate[studentId];

                      return (
                        <tr key={enrollment.id}>

                          <td className="px-4 py-4 font-medium">
                            {enrollment.student_name ||
                              'بدون اسم'}
                          </td>

                          <td className="px-4 py-4 text-gray-500">
                            {enrollment.student_no || '-'}
                          </td>

                          <td className="px-4 py-4">
                            <select
                              value={
                                statuses[studentId] ||
                                'present'
                              }
                              onChange={(event) =>
                                setStatus(
                                  studentId,
                                  event.target.value
                                )
                              }
                              className="rounded-lg border px-3 py-2"
                            >
                              {Object.entries(
                                STATUS_LABELS
                              ).map(
                                ([value, label]) => (
                                  <option
                                    key={value}
                                    value={value}
                                  >
                                    {label}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="text"
                              value={
                                notes[studentId] || ''
                              }
                              onChange={(event) =>
                                setNotes((previous) => ({
                                  ...previous,
                                  [studentId]:
                                    event.target.value,
                                }))
                              }
                              placeholder="ملاحظات"
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                saveAttendance(
                                  enrollment
                                )
                              }
                              disabled={
                                saving === studentId
                              }
                              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                              {saving === studentId
                                ? '...'
                                : existing
                                  ? 'تحديث'
                                  : 'حفظ'}
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>
      </main>
    </Shell>
  );
}