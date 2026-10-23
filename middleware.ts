import {NextRequest,NextResponse} from 'next/server'
import {jwtVerify} from 'jose'
function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(s&&s.length>=32)return s;if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET missing or under 32 chars. Set a strong random value (32+ chars) in environment variables before production.');return s||'dev-only-insecure-secret-change-me-before-prod'}
const secret=new TextEncoder().encode(resolveAuthSecret())
export async function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(path.startsWith('/api/auth/')||path==='/api/certificates/verify'||path==='/login'||path==='/verify'||path==='/'||path.startsWith('/_next')||path==='/favicon.ico'||path==='/api/health'||path==='/api/leads'||path==='/privacy'||path==='/terms'||path==='/offline'||path==='/robots.txt'||path==='/sitemap.xml'||path==='/manifest.webmanifest'||path==='/manifest.json'||path==='/sw.js')return NextResponse.next();
  const token=req.cookies.get('session')?.value;
  if(!token){if(path.startsWith('/api/'))return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
  const isApi = path.startsWith('/api/');
  try{
    const verified=await jwtVerify(token,secret);
    const role=String(verified.payload.role||'');
    const method=req.method.toUpperCase();
    const isLearner=role==='student'||role==='guardian';
    const learnerAllowed=path.startsWith('/portal')||path.startsWith('/api/learner/')||path==='/api/me'||(role==='student'&&path.startsWith('/api/attempts'))||(role==='student'&&method==='GET'&&path.startsWith('/api/assignments'))||(method==='GET'&&path.startsWith('/api/videos/')&&path.endsWith('/stream'));
    const teacherAdminOnly=['/finance','/users','/settings','/plans','/activation-codes','/audit','/certificates','/ai','/api/invoices','/api/payments','/api/users','/api/settings','/api/plans','/api/activation-codes','/api/audit','/api/certificates','/api/ai'];
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
export const config={matcher:['/((?!api/auth|api/certificates/verify|login|verify|_next|favicon.ico|api/health|api/leads).*)']};
