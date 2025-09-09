import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET || '';
  if (!secret) {
    console.warn('ADMIN_JWT_SECRET is not set. Using a weak default for dev only.');
    return new TextEncoder().encode('dev-secret-not-for-production');
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(expSeconds = 60 * 60 * 8) {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expSeconds}s`)
    .sign(getJwtSecret());
  return token;
}

export async function verifyAdminSession(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload && payload.admin === true) return payload;
    return null;
  } catch {
    return null;
  }
}

export function isPasswordValid(pw: string | undefined | null) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  return pw === expected;
}

