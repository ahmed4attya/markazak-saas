export const ROLE_VALUES = ['owner', 'manager', 'admin', 'teacher', 'student', 'guardian', 'staff'] as const;
export type AccessRole = typeof ROLE_VALUES[number];
export const isAdminRole = (role: string) => ['owner', 'manager', 'admin'].includes(role);
export const isAccessRole = (v: string): v is AccessRole => ROLE_VALUES.includes(v as any);
