import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { db } from "@/lib/db";

const TWO_FACTOR_IDENTIFIER_PREFIX = "2fa:";
const VERSION_PREFIX = "v1";

function getCryptoKey() {
  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  return createHash("sha256").update(secret).digest();
}

function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const key = getCryptoKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptSecret(payload: string): string {
  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) {
    throw new Error("Malformed 2FA payload");
  }

  const iv = Buffer.from(ivRaw, "base64url");
  const tag = Buffer.from(tagRaw, "base64url");
  const encrypted = Buffer.from(dataRaw, "base64url");

  const key = getCryptoKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function recordIdentifier(userId: string) {
  return `${TWO_FACTOR_IDENTIFIER_PREFIX}${userId}`;
}

export async function getTwoFactorState(userId: string) {
  const record = await db.verificationToken.findFirst({
    where: { identifier: recordIdentifier(userId) },
    orderBy: { expires: "desc" },
  });

  if (!record) {
    return {
      enabled: false,
      secret: null as string | null,
    };
  }

  const [, encryptedSecret] = record.token.split(":");
  if (!encryptedSecret) {
    return {
      enabled: false,
      secret: null as string | null,
    };
  }

  try {
    return {
      enabled: true,
      secret: decryptSecret(encryptedSecret),
    };
  } catch {
    return {
      enabled: false,
      secret: null as string | null,
    };
  }
}

export async function enableTwoFactor(userId: string, secret: string) {
  const encrypted = encryptSecret(secret);
  await db.verificationToken.deleteMany({
    where: { identifier: recordIdentifier(userId) },
  });

  await db.verificationToken.create({
    data: {
      identifier: recordIdentifier(userId),
      token: `${VERSION_PREFIX}:${encrypted}`,
      expires: new Date("2099-01-01T00:00:00.000Z"),
    },
  });
}

export async function disableTwoFactor(userId: string) {
  await db.verificationToken.deleteMany({
    where: { identifier: recordIdentifier(userId) },
  });
}
