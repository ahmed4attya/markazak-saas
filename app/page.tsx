import {redirect} from 'next/navigation';import {getSession} from '@/lib/auth';export default async function Page(){const s=await getSession();redirect(s?'/dashboard':'/login')}
