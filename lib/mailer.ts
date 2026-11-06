// lib/mailer.ts - Unified Email System for Markazak SaaS (Inspired by Daftr-re Enterprise Pattern)
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendOtpOptions {
  toEmail: string;
  code: string;
  expiresMinutes?: number;
}

export interface GenericMailOptions {
  toEmail: string;
  subject: string;
  html: string;
}

export interface Mailer {
  sendOtp(options: SendOtpOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendMail(options: GenericMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Unified Arabic Email Shell with Markazak SaaS Brand Identity (Night Luxe Dark Accent)
 */
export function systemEmailTemplate(
  title: string,
  bodyHtml: string,
  options?: { badge?: string; ctaText?: string; ctaUrl?: string }
): string {
  const badgeHtml = options?.badge
    ? `<div style="display:inline-block; padding:4px 12px; background:rgba(245,158,11,0.15); border:1px solid #f59e0b; border-radius:20px; font-size:12px; font-weight:bold; color:#fbbf24; margin-bottom:12px;">${options.badge}</div>`
    : '';

  const ctaHtml =
    options?.ctaText && options?.ctaUrl
      ? `<div style="text-align:center; margin:28px 0 10px;">
           <a href="${options.ctaUrl}" style="display:inline-block; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#ffffff; font-weight:bold; font-size:14px; text-decoration:none; padding:12px 32px; border-radius:10px; box-shadow:0 4px 14px rgba(59,130,246,0.35);">
             ${options.ctaText}
           </a>
         </div>`
      : '';

  return `
    <div dir="rtl" style="font-family:'Cairo','IBM Plex Sans Arabic',Tahoma,Arial,sans-serif; max-width:600px; margin:auto; padding:24px 16px; background-color:#0b0f17; color:#f8fafc; border-radius:16px; border:1px solid #1e293b;">
      <div style="text-align:center; padding-bottom:18px; border-bottom:1px solid #1e293b;">
        <div style="font-size:24px; font-weight:900; letter-spacing:-0.5px; color:#ffffff;">
          <span style="color:#fbbf24;">مركزك</span> | Markazak SaaS
        </div>
        <p style="margin:4px 0 0; font-size:12px; color:#94a3b8;">المنصة الذكية لإدارة مراكز التدريب والقدرات والتحصيلي</p>
      </div>

      <div style="text-align:center; padding:20px 0 10px;">
        ${badgeHtml}
        <h2 style="margin:0; font-size:18px; font-weight:800; color:#f8fafc;">${title}</h2>
      </div>

      <div style="background-color:#131b2a; padding:24px; border-radius:14px; margin:16px 0; border:1px solid #243047; color:#e2e8f0; font-size:14px; line-height:1.8;">
        ${bodyHtml}
        ${ctaHtml}
      </div>

      <div style="padding-top:16px; border-top:1px solid #1e293b; text-align:center;">
        <p style="margin:0 0 4px; font-size:11px; color:#64748b;">
          🛡️ رسالة آلية صادرة من نظام الحماية لمنصة مركزك SaaS — يرجى عدم الرد المباشر على هذه الرسالة.
        </p>
        <p style="margin:0; font-size:11px; color:#475569;">
          جميع الحقوق محفوظة © ${new Date().getFullYear()} مركزك للحلول الرقمية
        </p>
      </div>
    </div>
  `;
}

export class ConsoleMailer implements Mailer {
  async sendOtp({ toEmail, code, expiresMinutes = 10 }: SendOtpOptions) {
    console.log(
      `📧 [ConsoleMailer] OTP Dispatched → ${toEmail} | Code: [${code}] | Valid: ${expiresMinutes} mins`
    );
    return { success: true, messageId: `console-otp-${Date.now()}` };
  }

  async sendMail({ toEmail, subject }: GenericMailOptions) {
    console.log(`📧 [ConsoleMailer] Mail Dispatched → ${toEmail} | Subject: "${subject}"`);
    return { success: true, messageId: `console-mail-${Date.now()}` };
  }
}

export class ResendMailer implements Mailer {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(
    apiKey = process.env.RESEND_API_KEY || '',
    fromEmail = process.env.MAIL_FROM || 'no-reply@markazak.sa',
    fromName = 'منصة مركزك'
  ) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendOtp({ toEmail, code, expiresMinutes = 10 }: SendOtpOptions) {
    if (!this.apiKey) return { success: false, error: 'RESEND_API_KEY is not configured' };
    const html = systemEmailTemplate(
      'رمز التحقق السريع للدخول',
      `
      <p style="font-size:14px; margin-bottom:16px;">أهلاً بك، لقد تلقينا طلباً للدخول إلى حسابك في منصة مركزك.</p>
      <div style="background-color:#0b0f17; padding:20px; border-radius:12px; text-align:center; margin:20px 0; border:2px dashed #f59e0b;">
        <p style="font-size:13px; color:#94a3b8; margin:0 0 8px;">رمز التحقق لتسجيل الدخول (صالح لمدة ${expiresMinutes} دقائق):</p>
        <span style="font-size:36px; font-weight:bold; letter-spacing:8px; color:#fbbf24; font-family:monospace;">${code}</span>
      </div>
      <p style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0;">
        ⚠️ هذا الرمز مخصص لاستخدامك لمرة واحدة فقط. إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذه الرسالة والتأكد من أمان حسابك.
      </p>
      `,
      { badge: '🔐 رمز الأمان' }
    );

    return this.sendMail({
      toEmail,
      subject: `🔐 رمز الدخول لمنصة مركزك: ${code}`,
      html,
    });
  }

  async sendMail({ toEmail, subject, html }: GenericMailOptions) {
    if (!this.apiKey) return { success: false, error: 'RESEND_API_KEY is not configured' };
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to: [toEmail],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Resend error (${res.status}): ${err}` };
      }
      const data = await res.json();
      return { success: true, messageId: data.id };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Resend request failed' };
    }
  }
}

export class BrevoMailer implements Mailer {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(
    apiKey = process.env.BREVO_API_KEY || '',
    fromEmail = process.env.MAIL_FROM || 'no-reply@markazak.sa',
    fromName = 'منصة مركزك'
  ) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendOtp({ toEmail, code, expiresMinutes = 10 }: SendOtpOptions) {
    const html = systemEmailTemplate(
      'رمز التحقق السريع للدخول',
      `
      <p style="font-size:14px; margin-bottom:16px;">أهلاً بك، لقد تلقينا طلباً للدخول إلى حسابك في منصة مركزك.</p>
      <div style="background-color:#0b0f17; padding:20px; border-radius:12px; text-align:center; margin:20px 0; border:2px dashed #f59e0b;">
        <p style="font-size:13px; color:#94a3b8; margin:0 0 8px;">رمز التحقق لتسجيل الدخول (صالح لمدة ${expiresMinutes} دقائق):</p>
        <span style="font-size:36px; font-weight:bold; letter-spacing:8px; color:#fbbf24; font-family:monospace;">${code}</span>
      </div>
      <p style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0;">
        ⚠️ هذا الرمز مخصص لاستخدامك لمرة واحدة فقط. إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذه الرسالة.
      </p>
      `,
      { badge: '🔐 رمز الأمان' }
    );

    return this.sendMail({
      toEmail,
      subject: `🔐 رمز الدخول لمنصة مركزك: ${code}`,
      html,
    });
  }

  async sendMail({ toEmail, subject, html }: GenericMailOptions) {
    if (!this.apiKey) return { success: false, error: 'BREVO_API_KEY is not configured' };
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Brevo error (${res.status}): ${err}` };
      }
      const data = await res.json();
      return { success: true, messageId: data.messageId };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Brevo request failed' };
    }
  }
}

export class GmailMailer implements Mailer {
  private transporter: Transporter | null = null;
  private user: string;
  private pass: string;
  private fromName: string;

  constructor() {
    this.user = process.env.GMAIL_USER || process.env.SMTP_USER || '';
    this.pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
    this.fromName = process.env.MAIL_FROM_NAME || 'منصة مركزك';
    if (this.user && this.pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });
    }
  }

  async sendOtp({ toEmail, code, expiresMinutes = 10 }: SendOtpOptions) {
    const html = systemEmailTemplate(
      'رمز التحقق السريع للدخول',
      `
      <p style="font-size:14px; margin-bottom:16px;">أهلاً بك، لقد تلقينا طلباً للدخول إلى حسابك في منصة مركزك.</p>
      <div style="background-color:#0b0f17; padding:20px; border-radius:12px; text-align:center; margin:20px 0; border:2px dashed #f59e0b;">
        <p style="font-size:13px; color:#94a3b8; margin:0 0 8px;">رمز التحقق لتسجيل الدخول (صالح لمدة ${expiresMinutes} دقائق):</p>
        <span style="font-size:36px; font-weight:bold; letter-spacing:8px; color:#fbbf24; font-family:monospace;">${code}</span>
      </div>
      <p style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0;">
        ⚠️ هذا الرمز مخصص لاستخدامك لمرة واحدة فقط. إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذه الرسالة والتأكد من أمان حسابك.
      </p>
      `,
      { badge: '🔐 رمز الأمان' }
    );

    return this.sendMail({
      toEmail,
      subject: `🔐 رمز الدخول لمنصة مركزك: ${code}`,
      html,
    });
  }

  async sendMail({ toEmail, subject, html }: GenericMailOptions) {
    if (!this.transporter) {
      return { success: false, error: 'Gmail credentials (GMAIL_USER, GMAIL_APP_PASSWORD) not configured' };
    }
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.user}>`,
        to: toEmail,
        subject,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (e: unknown) {
      console.error('Gmail send error:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Gmail sending failed' };
    }
  }
}

export function getMailer(): Mailer {
  const driver = (process.env.MAIL_DRIVER || '').toLowerCase();
  if (driver === 'gmail' || (!driver && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)) {
    return new GmailMailer();
  }
  if (driver === 'resend' || (!driver && process.env.RESEND_API_KEY)) {
    return new ResendMailer();
  }
  if (driver === 'brevo' || (!driver && process.env.BREVO_API_KEY)) {
    return new BrevoMailer();
  }
  return new ConsoleMailer();
}

/**
 * Dispatch an OTP Code Email
 */
export async function sendOtpEmail(toEmail: string, code: string, expiresMinutes = 10) {
  const mailer = getMailer();
  return mailer.sendOtp({ toEmail, code, expiresMinutes });
}

/**
 * Notify Admin of New Center/Teacher Registration Request
 */
export async function sendRegistrationPendingAdmin(
  adminEmail: string,
  data: { name: string; email: string; phone?: string; centerName?: string; date?: string }
) {
  const mailer = getMailer();
  const html = systemEmailTemplate(
    'طلب انضمام جديد بانتظار الموافقة',
    `
    <p style="margin:0 0 14px; font-size:14px;">تم تسجيل طلب انضمام جديد على المنصة ويتطلب مراجعة واعتماد الإدارة للتمكن من الدخول:</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:13px;">
      <tr>
        <td style="padding:8px; border-bottom:1px solid #1e293b; color:#94a3b8; width:35%;">اسم المتقدم:</td>
        <td style="padding:8px; border-bottom:1px solid #1e293b; font-weight:bold; color:#ffffff;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding:8px; border-bottom:1px solid #1e293b; color:#94a3b8;">البريد الإلكتروني:</td>
        <td style="padding:8px; border-bottom:1px solid #1e293b; font-weight:bold; color:#38bdf8;" dir="ltr">${data.email}</td>
      </tr>
      ${data.centerName ? `<tr><td style="padding:8px; border-bottom:1px solid #1e293b; color:#94a3b8;">اسم المركز / الجهة:</td><td style="padding:8px; border-bottom:1px solid #1e293b; font-weight:bold; color:#ffffff;">${data.centerName}</td></tr>` : ''}
      ${data.phone ? `<tr><td style="padding:8px; border-bottom:1px solid #1e293b; color:#94a3b8;">رقم التواصل:</td><td style="padding:8px; border-bottom:1px solid #1e293b; color:#ffffff;" dir="ltr">${data.phone}</td></tr>` : ''}
      <tr>
        <td style="padding:8px; border-bottom:1px solid #1e293b; color:#94a3b8;">تاريخ التقديم:</td>
        <td style="padding:8px; border-bottom:1px solid #1e293b; color:#cbd5e1;">${data.date || new Date().toLocaleString('ar-SA')}</td>
      </tr>
    </table>
    <p style="margin:14px 0 0; font-size:13px; color:#cbd5e1;">
      يمكنك مراجعة كافة التفاصيل واعتماد أو رفض الطلب عبر لوحة تحكم الإدارة.
    </p>
    `,
    {
      badge: '🔔 طلب تسجيل جديد',
      ctaText: 'مراجعة الطلبات في لوحة الإدارة',
      ctaUrl: (process.env.APP_URL || 'https://markazak.sa') + '/dashboard',
    }
  );

  return mailer.sendMail({
    toEmail: adminEmail,
    subject: `🔔 طلب انضمام جديد بانتظار الاعتماد — ${data.name}`,
    html,
  });
}

/**
 * Send Confirmation to User that their Registration was Received
 */
export async function sendRegistrationReceivedUser(toEmail: string, data: { name: string; centerName?: string }) {
  const mailer = getMailer();
  const html = systemEmailTemplate(
    'تم استلام طلب انضمامك بنجاح',
    `
    <p style="font-size:14px; margin-bottom:12px;">مرحباً <strong>${data.name}</strong>،</p>
    <p style="font-size:14px; line-height:1.7; margin-bottom:16px;">
      نشكرك على اهتمامك بالانضمام إلى <strong>منصة مركزك</strong>. لقد تم استلام بيانات تسجيلك ${data.centerName ? `لمركز «${data.centerName}»` : ''} بنجاح، وطلبك حالياً قيد المراجعة والتدقيق من قبل فريق الإدارة.
    </p>
    <div style="background-color:#0b0f17; padding:16px; border-radius:12px; border-right:4px solid #f59e0b; margin:16px 0;">
      <p style="margin:0; font-size:13px; color:#cbd5e1;">
        ⏱️ تستغرق عملية المراجعة عادةً وقتاً وجيزاً. ستصلك رسالة تأكيد بالبريد الإلكتروني فور اعتماد حسابك لتتمكن من تسجيل الدخول مباشرة.
      </p>
    </div>
    <p style="font-size:12px; color:#94a3b8; margin:0;">إذا كانت لديك أي استفسارات عاجلة، لا تتردد بالتواصل مع فريق الدعم الفني.</p>
    `,
    { badge: '⏳ قيد المراجعة' }
  );

  return mailer.sendMail({
    toEmail,
    subject: `📋 استلام طلب التسجيل في منصة مركزك — قيد المراجعة`,
    html,
  });
}

/**
 * Send Approval Notification to User with Direct Login Link
 */
export async function sendRegistrationApproved(toEmail: string, data: { name: string; loginUrl?: string }) {
  const mailer = getMailer();
  const loginUrl = data.loginUrl || (process.env.APP_URL || 'https://markazak.sa') + '/login';

  const html = systemEmailTemplate(
    'تهانينا! تمت الموافقة على حسابك وتفعيله',
    `
    <p style="font-size:14px; margin-bottom:12px;">أهلاً بك <strong>${data.name}</strong>،</p>
    <p style="font-size:14px; line-height:1.7; margin-bottom:16px;">
      يسرنا إبلاغك بأنه تمت مراجعة واعتماد طلب انضمامك إلى <strong>منصة مركزك</strong> بنجاح. حسابك الآن نشط بالكامل وجاهز للاستخدام.
    </p>
    <div style="background-color:#0b0f17; padding:16px; border-radius:12px; border:1px solid #10b981; margin:16px 0;">
      <p style="margin:0; font-size:13px; color:#34d399; font-weight:bold;">
        ✅ يمكنك الآن تسجيل الدخول مباشرة ببريدك الإلكتروني وكلمة المرور التي أنشأتها.
      </p>
    </div>
    `,
    {
      badge: '🎉 تم الاعتماد والتفعيل',
      ctaText: 'تسجيل الدخول إلى حسابك',
      ctaUrl: loginUrl,
    }
  );

  return mailer.sendMail({
    toEmail,
    subject: `🎉 تمت الموافقة على حسابك في منصة مركزك — يمكنك الدخول الآن`,
    html,
  });
}

/**
 * Send Rejection Notification to User
 */
export async function sendRegistrationRejected(toEmail: string, data: { name: string; reason?: string }) {
  const mailer = getMailer();
  const html = systemEmailTemplate(
    'تحديث بشأن طلب الانضمام إلى منصة مركزك',
    `
    <p style="font-size:14px; margin-bottom:12px;">مرحباً <strong>${data.name}</strong>،</p>
    <p style="font-size:14px; line-height:1.7; margin-bottom:16px;">
      نود إفادتك بأنه بعد مراجعة بيانات طلب التسجيل المقدم، تعذر علينا اعتماد الحساب في الوقت الحالي.
    </p>
    ${
      data.reason
        ? `<div style="background-color:#0b0f17; padding:16px; border-radius:12px; border:1px solid #ef4444; margin:16px 0;">
             <p style="margin:0 0 6px; font-size:12px; color:#f87171; font-weight:bold;">سبب عدم الاعتماد:</p>
             <p style="margin:0; font-size:13px; color:#e2e8f0;">${data.reason}</p>
           </div>`
        : ''
    }
    <p style="font-size:12px; color:#94a3b8; margin:0;">
      إذا كنت تعتقد أن هناك خطأ أو ترغب في تعديل بيانات الطلب، يسعدنا تواصلك مع إدارة المنصة.
    </p>
    `,
    { badge: 'تحديث الطلب' }
  );

  return mailer.sendMail({
    toEmail,
    subject: `إشعار بشأن طلب الانضمام إلى منصة مركزك`,
    html,
  });
}
