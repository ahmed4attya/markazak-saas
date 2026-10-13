import {NextRequest,NextResponse} from 'next/server'
import {jwtVerify} from 'jose'
function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(s&&s.length>=32)return s;if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET غير مضبوط أو أقصر من 32 حرف. حدد قيمة عشوائية قوية (32+ حرف) في متغيرات البيئة قبل تشغيل production.');return s||'dev-only-insecure-secret-change-me-before-prod'}
const secret=new TextEncoder().encode(resolveAuthSecret())
export async function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(path.startsWith('/api/auth/')||path==='/api/certificates/verify'||path==='/login'||path==='/verify'||path.startsWith('/_next')||path==='/favicon.ico'||path==='/api/health')return NextResponse.next();
  const token=req.cookies.get('session')?.value;
  if(!token){if(path.startsWith('/api/'))return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
  try{
    const verified=await jwtVerify(token,secret);
    const role=String(verified.payload.role||'');
    const method=req.method.toUpperCase();
    const isApi=path.startsWith('/api/');
    const isLearner=role==='student'||role==='guardian';
    const learnerAllowed=path.startsWith('/portal')||path.startsWith('/api/learner/')||(role==='student'&&path.startsWith('/api/attempts'))||(role==='student'&&method==='GET'&&path.startsWith('/api/assignments'));
    const teacherAdminOnly=['/finance','/users','/settings','/plans','/audit','/api/invoices','/api/payments','/api/users','/api/settings','/api/plans','/api/audit'];
    const teacherMutationBlocked=['/api/students','/api/teachers','/api/courses','/api/groups','/api/classrooms','/api/enrollments'];
    const hasPrefix=(items:string[])=>items.some((item)=>path===item||path.startsWith(item+'/'));
    const teacherAdminReport=role==='teacher'&&((path==='/reports')||(path.startsWith('/reports/')&&!path.startsWith('/reports/learning'))||(path==='/api/reports')||(path.startsWith('/api/reports/')&&!path.startsWith('/api/reports/learning')));
    if(isLearner&&!learnerAllowed){if(isApi)return NextResponse.json({error:'forbidden'},{status:403});return NextResponse.redirect(new URL('/portal',req.url))}
    if((role==='teacher'&&hasPrefix(teacherAdminOnly))||teacherAdminReport){if(isApi)return NextResponse.json({error:'forbidden'},{status:403});return NextResponse.redirect(new URL('/dashboard',req.url))}
    if(role==='teacher'&&method!=='GET'&&hasPrefix(teacherMutationBlocked))return NextResponse.json({error:'forbidden'},{status:403});
    return NextResponse.next();
  }catch{if(path.startsWith('/api/'))return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
}
export const config={matcher:['/dashboard/:path*','/students/:path*','/teachers/:path*','/courses/:path*','/groups/:path*','/attendance/:path*','/finance/:path*','/certificates/:path*','/reports/:path*','/ai/:path*','/users/:path*','/plans/:path*','/settings/:path*','/questions/:path*','/exams/:path*','/lessons/:path*','/portal/:path*','/api/:path*']}
