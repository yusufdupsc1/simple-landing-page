import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ApiAuthContext {
  userId: string;
  institutionId: string;
  role: Role;
  email?: string;
  phone?: string;
}

function getAuthSecrets() {
  return [process.env.AUTH_SECRET, process.env.NEXTAUTH_SECRET].filter(
    (secret): secret is string => Boolean(secret),
  );
}

async function fromSession(): Promise<ApiAuthContext | null> {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        email?: string;
        phone?: string | null;
        institutionId?: string;
        role?: Role;
      }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) return null;

  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
    email: user.email,
    phone: user.phone ?? undefined,
  };
}

async function fromBearer(req: NextRequest): Promise<ApiAuthContext | null> {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const secrets = getAuthSecrets();
  for (const secret of secrets) {
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      const userId = payload.sub;
      const institutionId =
        (payload.institutionId as string | undefined) ??
        (payload["institutionId"] as string | undefined);
      const role =
        (payload.role as Role | undefined) ??
        (payload["role"] as Role | undefined);

      if (userId && institutionId && role) {
        return {
          userId,
          institutionId,
          role,
          email: payload.email,
          phone: (payload.phone as string | undefined) ?? undefined,
        };
      }

      if (payload.email && typeof payload.email === "string") {
        const dbUser = await db.user.findUnique({
          where: { email: payload.email },
          select: { id: true, institutionId: true, role: true, email: true, phone: true },
        });

        if (dbUser) {
          return {
            userId: dbUser.id,
            institutionId: dbUser.institutionId,
            role: dbUser.role,
            email: dbUser.email,
            phone: dbUser.phone ?? undefined,
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function getApiAuthContext(
  req?: NextRequest,
): Promise<ApiAuthContext | null> {
  const sessionCtx = await fromSession();
  if (sessionCtx) return sessionCtx;

  if (req) {
    return fromBearer(req);
  }

  return null;
}
