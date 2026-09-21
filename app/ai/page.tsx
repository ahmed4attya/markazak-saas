'use client';

import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';
import { Brain, Send, Sparkles, RefreshCw } from 'lucide-react';

const quickPrompts = [
  'حلل الحضور الحالي واقترح إجراءات للتحسين',
  'حلل الوضع المالي للمركز',
  'اعطني ملخصاً شاملاً عن المركز',
  'حلل الطلاب والدورات والمجموعات',
];

export default function AI() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);

  async function ask(text = prompt) {
    if (!text.trim() || loading) return;

    setPrompt(text);
    setLoading(true);

    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.error || 'تعذر تنفيذ التحليل');
      }

      setAnswer(j.answer || '');
      setContext(j.context || null);
    } catch (e: any) {
      setAnswer(`حدث خطأ: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ask('اعطني ملخصاً شاملاً عن المركز');
  }, []);

  return (
    <Shell
      title="مساعد الذكاء الاصطناعي"
      subtitle="تحليل بيانات المركز وتحويلها إلى معلومات قابلة للتنفيذ"
    >
      <div className="aiHero">
        <div className="aiIcon">
          <Brain />
        </div>

        <div>
          <h2>مساعد المركز</h2>
          <p>
            اسأل عن الطلاب والحضور والدورات والمجموعات والفواتير
            والإيرادات، وسيتم التحليل اعتماداً على بيانات مركزك.
          </p>
        </div>
      </div>

      {context && (
        <div className="statsGrid">
          <div className="statCard">
            <span>الطلاب</span>
            <strong>{context.students}</strong>
          </div>

          <div className="statCard">
            <span>المدربون</span>
            <strong>{context.teachers}</strong>
          </div>

          <div className="statCard">
            <span>الدورات</span>
            <strong>{context.courses}</strong>
          </div>

          <div className="statCard">
            <span>نسبة الحضور</span>
            <strong>{context.attendance.rate}%</strong>
          </div>

          <div className="statCard">
            <span>المحصل</span>
            <strong>
              {Number(context.finance.paid).toLocaleString('ar-SA')} ر.س
            </strong>
          </div>

          <div className="statCard">
            <span>المستحق</span>
            <strong>
              {Number(context.finance.outstanding).toLocaleString('ar-SA')} ر.س
            </strong>
          </div>
        </div>
      )}

      <div className="aiGrid">
        <div className="panel">
          <div className="panelHead">
            <h3>اسأل المساعد</h3>
            <Sparkles size={18} />
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {quickPrompts.map(x => (
              <button
                key={x}
                className="ghost"
                style={{ textAlign: 'right' }}
                onClick={() => setPrompt(x)}
              >
                {x}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={7}
            placeholder="اكتب سؤالك هنا..."
          />

          <button
            className="primary"
            onClick={() => ask()}
            disabled={loading || !prompt.trim()}
          >
            <Send size={16} />
            {loading ? 'جاري التحليل...' : 'تحليل'}
          </button>
        </div>

        <div className="panel aiResult">
          <div className="panelHead">
            <h3>النتيجة</h3>

            <button
              className="ghost"
              onClick={() => ask('اعطني ملخصاً شاملاً عن المركز')}
              disabled={loading}
              title="تحديث التحليل"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {answer || 'ستظهر النتيجة هنا.'}
          </pre>
        </div>
      </div>
    </Shell>
  );
}
