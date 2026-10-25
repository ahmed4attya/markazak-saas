import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DUMMY_HASH = '$2a$10$wE8wB2P6K0mH1mO7dZ1L7uX5l7hJqK0bS6uG3yJ8mO7dZ1L7uX5l7';

export const PASSWORD_MIN_LENGTH = 12;

export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `يجب أن تتكون كلمة المرور من ${PASSWORD_MIN_LENGTH} حرفاً على الأقل`,
    };
  }
  return { valid: true };
}

export async function comparePasswordSafe(plainPassword: string, storedHash?: string | null): Promise<boolean> {
  const hashToCompare = storedHash && storedHash.startsWith('$2') ? storedHash : DUMMY_HASH;
  const match = await bcrypt.compare(plainPassword, hashToCompare);
  return Boolean(storedHash && match);
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  const secret = process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me-before-prod';
  return crypto.createHmac('sha256', secret).update(token.trim()).digest('hex');
}
