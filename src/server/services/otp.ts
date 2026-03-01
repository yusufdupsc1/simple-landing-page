import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import type { LoginScope } from "@/lib/auth-scope";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/identity";

const OTP_EXPIRY_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 45;
const OTP_MAX_ATTEMPTS = 5;

interface OtpSendInput {
  institutionId: string;
  phone: string;
  scope: LoginScope;
  userId?: string;
}

interface OtpVerifyInput {
  challengeId: string;
  institutionId: string;
  phone: string;
  scope: LoginScope;
  code: string;
}

function buildCodeHash(input: {
  challengeId: string;
  institutionId: string;
  phone: string;
  scope: LoginScope;
  code: string;
}) {
  const payload = [
    input.challengeId,
    input.institutionId,
    input.phone,
    input.scope,
    input.code,
    env.AUTH_SECRET,
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

function safeCompareHex(leftHex: string, rightHex: string) {
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function generateOtpCode() {
  const value = randomInt(0, 1_000_000);
  return value.toString().padStart(6, "0");
}

function twilioConfigured() {
  return Boolean(
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID,
  );
}

function twilioAuthHeader() {
  const raw = `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function sendViaTwilioVerify(phone: string) {
  if (!twilioConfigured()) return null;

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: {
        authorization: twilioAuthHeader(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        Channel: "sms",
      }).toString(),
      cache: "no-store",
    },
  );

  const json = (await res.json().catch(() => ({}))) as { sid?: string; status?: string; message?: string };
  if (!res.ok || !json.sid) {
    throw new Error(json.message || "Failed to send OTP via Twilio Verify");
  }

  return json.sid;
}

async function verifyViaTwilio(input: { phone: string; code: string }) {
  if (!twilioConfigured()) return false;

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        authorization: twilioAuthHeader(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.phone,
        Code: input.code,
      }).toString(),
      cache: "no-store",
    },
  );

  const json = (await res.json().catch(() => ({}))) as { status?: string };
  return res.ok && json.status === "approved";
}

export async function createOtpChallenge(input: OtpSendInput) {
  const now = new Date();
  const phone = normalizePhone(input.phone);
  if (!phone) {
    throw new Error("Invalid phone number");
  }

  const latest = await db.phoneOtpChallenge.findFirst({
    where: {
      institutionId: input.institutionId,
      phone,
      scope: input.scope,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, resendAfter: true },
  });

  if (latest?.resendAfter && latest.resendAfter > now) {
    return {
      challengeId: latest.id,
      cooldownSeconds: Math.max(1, Math.ceil((latest.resendAfter.getTime() - now.getTime()) / 1000)),
      sent: false,
      devCode: null as string | null,
    };
  }

  const code = generateOtpCode();

  const created = await db.phoneOtpChallenge.create({
    data: {
      institutionId: input.institutionId,
      userId: input.userId ?? null,
      scope: input.scope,
      phone,
      codeHash: "pending",
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000),
      resendAfter: new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000),
    },
    select: {
      id: true,
      phone: true,
      institutionId: true,
      scope: true,
    },
  });

  const codeHash = buildCodeHash({
    challengeId: created.id,
    institutionId: created.institutionId,
    phone: created.phone,
    scope: created.scope,
    code,
  });

  let twilioSid: string | null = null;
  if (twilioConfigured()) {
    twilioSid = await sendViaTwilioVerify(created.phone);
  }

  await db.phoneOtpChallenge.update({
    where: { id: created.id },
    data: {
      codeHash,
      twilioSid,
    },
  });

  const devCode = twilioConfigured() || env.NODE_ENV === "production" ? null : code;

  return {
    challengeId: created.id,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    sent: true,
    devCode,
  };
}

export async function verifyOtpChallenge(input: OtpVerifyInput) {
  const now = new Date();
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { success: false as const, reason: "INVALID_PHONE" as const };
  }

  const challenge = await db.phoneOtpChallenge.findFirst({
    where: {
      id: input.challengeId,
      institutionId: input.institutionId,
      scope: input.scope,
      phone,
    },
    select: {
      id: true,
      institutionId: true,
      phone: true,
      scope: true,
      attempts: true,
      maxAttempts: true,
      codeHash: true,
      expiresAt: true,
      consumedAt: true,
      userId: true,
      twilioSid: true,
    },
  });

  if (!challenge) {
    return { success: false as const, reason: "NOT_FOUND" as const };
  }

  if (challenge.consumedAt) {
    return { success: false as const, reason: "ALREADY_USED" as const };
  }

  if (challenge.expiresAt <= now) {
    return { success: false as const, reason: "EXPIRED" as const };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return { success: false as const, reason: "MAX_ATTEMPTS" as const };
  }

  let verified = false;
  if (twilioConfigured() && challenge.twilioSid) {
    verified = await verifyViaTwilio({ phone: challenge.phone, code: input.code.trim() });
  } else {
    const expectedHash = buildCodeHash({
      challengeId: challenge.id,
      institutionId: challenge.institutionId,
      phone: challenge.phone,
      scope: challenge.scope,
      code: input.code.trim(),
    });
    verified = safeCompareHex(challenge.codeHash, expectedHash);
  }

  if (!verified) {
    await db.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: { increment: 1 },
      },
    });
    return { success: false as const, reason: "INVALID_CODE" as const };
  }

  await db.phoneOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: now,
    },
  });

  return {
    success: true as const,
    challengeId: challenge.id,
    userId: challenge.userId,
  };
}
