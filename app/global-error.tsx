'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-gray-50 text-center p-10">
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <div className="text-red-500 text-6xl">💥</div>
          <h1 className="text-2xl font-bold">خطأ كارثي في النظام</h1>
          <p className="text-gray-600">حدث خطأ غير متوقع على مستوى التطبيق بالكامل.</p>
          <button 
            onClick={() => reset()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium"
          >
            إعادة تشغيل التطبيق
          </button>
        </div>
      </body>
    </html>
  );
}
