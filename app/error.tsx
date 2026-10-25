'use client';

import { useEffect } from 'react';
import Shell from '@/components/Shell';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <Shell title="خطأ في النظام" subtitle="حدث خطأ غير متوقع">
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-xl font-bold">عذراً، حدث خطأ ما</h2>
        <p className="text-gray-500 max-w-md">
          لقد تم تسجيل الخطأ لدينا. يرجى محاولة تحديث الصفحة أو التواصل مع الدعم الفني.
        </p>
        <button 
          onClick={() => reset()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium"
        >
          محاولة مرة أخرى
        </button>
      </div>
    </Shell>
  );
}
