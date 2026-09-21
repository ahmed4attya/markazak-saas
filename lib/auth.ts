import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(!s||s.length<32)throw new Error('AUTH_SECRET must be set and be at least 32 characters long');return s}
const secret=new TextEncoder().encode(resolveAuthSecret())
export type Session={userId:string;tenantId:string;role:string;name:string;email:string}
export async function signSession(s:Session){return new SignJWT(s).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret)}
export async function getSession():Promise<Session|null>{const c=await cookies();const token=c.get('session')?.value;if(!token)return null;try{return (await jwtVerify(token,secret)).payload as unknown as Session}catch{return null}}
export function isAdmin(role:string){return ['owner','manager','admin'].includes(role)}
