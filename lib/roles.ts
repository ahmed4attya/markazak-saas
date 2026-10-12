// lib/roles.ts - CLIENT-SAFE role helpers. No server imports allowed here.
export function isAdminRole(role: string): boolean {
  return role === 'owner' || role === 'manager' || role === 'admin';
}