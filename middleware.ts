import {NextRequest,NextResponse} from 'next/server'
import {jwtVerify} from 'jose'
import { checkRate } from './lib/rate-limit'
function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(s&&s.length>=32)return s;if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET missing or under 32 chars. Set a strong random value (32+ chars) in environment variables before production.');return s||'dev-only-insecure-secret-change-me-before-prod'}
const secret=new TextEncoder().encode(resolveAuthSecret())
const RL_LIMITS:Record<string,number>={'/api/auth/login':10,'/api/leads':5,'/api/certificates/verify':30}
export async function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(RL_LIMITS[path]){
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
    const v=await checkRate(path+':'+ip,RL_LIMITS[path]);
    if(v&&!v.ok)return NextResponse.json({error:'rate limited'},{status:429});
  }
  if(path.startsWith('/api/auth/')||path==='/api/certificates/verify'||path==='/api/questions/extract'||path==='/login'||path==='/verify'||path==='/'||path.startsWith('/_next')||path==='/favicon.ico'||path==='/api/health'||path==='/api/stripe/webhook'||(path==='/api/leads'&&req.method==='POST')||path==='/privacy'||path==='/terms'||path==='/offline'||path==='/robots.txt'||path==='/sitemap.xml'||path==='/manifest.webmanifest'||path==='/manifest.json'||path==='/sw.js'||path==='/plans'||path==='/api/plans'||path.startsWith('/docs/')||path.startsWith('/icons/')||path.startsWith('/assets/'))return NextResponse.next();
  const token=req.cookies.get('session')?.value;
  if(!token){if(path.startsWith('/api/'))return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
  const isApi = path.startsWith('/api/');
  try{
    const verified=await jwtVerify(token,secret);
    const role=String(verified.payload.role||'');
    const method=req.method.toUpperCase();
    const userEmail = String(verified.payload.email || '').toLowerCase().trim();
    const superAdminEmail = (process.env.ADMIN_EMAIL || 'admin@center.sa').toLowerCase().trim();
    const isPlatformOwner = userEmail === superAdminEmail || userEmail === 'admin@center.sa';
    if (path === '/tenants' || path.startsWith('/tenants/') || path === '/api/tenants' || path.startsWith('/api/tenants/')) {
      if (!isPlatformOwner) {
        if (isApi) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    const isLearner=role==='student'||role==='guardian';
    const learnerAllowed=path.startsWith('/portal')||path.startsWith('/api/learner/')||path==='/api/me'||(role==='student'&&path.startsWith('/api/attempts'))||(role==='student'&&method==='GET'&&path.startsWith('/api/assignments'))||(method==='GET'&&path.startsWith('/api/videos/')&&path.endsWith('/stream'))||(method==='GET'&&path.startsWith('/api/files/')&&path.endsWith('/download'));
    const teacherAdminOnly=['/finance','/tenants','/users','/settings','/plans','/activation-codes','/audit','/certificates','/ai','/api/invoices','/api/payments','/api/tenants','/api/users','/api/settings','/api/plans','/api/activation-codes','/api/audit','/api/certificates','/api/ai','/api/stripe/checkout'];
    const teacherMutationBlocked=['/api/students','/api/teachers','/api/courses','/api/groups','/api/classrooms','/api/enrollments'];
    const hasPrefix=(items:string[])=>items.some((item)=>path===item||path.startsWith(item+'/'));
    const teacherAdminReport=role==='teacher'&&((path==='/reports')||(path.startsWith('/reports/')&&!path.startsWith('/reports/learning'))||(path==='/api/reports')||(path.startsWith('/api/reports/')&&!path.startsWith('/api/reports/learning')));
    if(isApi){
      if(isLearner&&!learnerAllowed)return NextResponse.json({error:'forbidden'},{status:403});
      if(role==='teacher'&&hasPrefix(teacherAdminOnly)&&!teacherAdminReport)return NextResponse.json({error:'forbidden'},{status:403});
      if(role==='teacher'&&hasPrefix(teacherMutationBlocked)&&method!=='GET')return NextResponse.json({error:'forbidden'},{status:403});
    }else{
      if(isLearner&&!path.startsWith('/portal'))return NextResponse.redirect(new URL('/portal',req.url));
      if(role==='teacher'&&hasPrefix(teacherAdminOnly)&&!teacherAdminReport)return NextResponse.redirect(new URL('/dashboard',req.url));
    }
    return NextResponse.next();
  }catch(e){if(isApi)return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
}
export const config={matcher:['/((?!api/auth|api/certificates/verify|login|verify|_next|favicon.ico|api/health|api/leads|api/stripe/webhook|docs|icons|assets).*)','/api/auth/login','/api/leads','/api/certificates/verify']};
