import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export type SessionUser = {
  id: string;
  schoolId: string;
  role: string;
  email: string;
  name: string | null;
};

const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL_SECONDS ?? 60 * 60 * 12);

type TokenPayload = {
  userId: string;
  exp: number;
};

function toBase64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? 'dev-session-secret-change-me';
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

export function createAuthToken(userId: string) {
  const payload: TokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function isValidSignature(encodedPayload: string, signature: string) {
  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function getUserIdFromAuthToken(token: string | undefined): string | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  if (!isValidSignature(encodedPayload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as TokenPayload;

    if (!parsed.userId || !parsed.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return parsed.userId;
  } catch {
    return null;
  }
}

export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get('auth_token')?.value;
  const userId = getUserIdFromAuthToken(token);

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      schoolId: true,
      role: true,
      email: true,
      name: true,
    },
  });

  return user;
}

export function canWriteSchoolData(role: string) {
  return role === 'admin';
}

export function canReadSchoolData(role: string) {
  return role === 'admin' || role === 'teacher';
}
