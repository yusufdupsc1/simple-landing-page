-- Enums
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');
CREATE TYPE "AccessRequestScope" AS ENUM ('TEACHER', 'STUDENT', 'PARENT');
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "LoginScope" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- Institution settings public reports
ALTER TABLE "institution_settings"
  ADD COLUMN "publicReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicReportsDescription" TEXT;

-- User approval + phone login
ALTER TABLE "users"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- Access requests
CREATE TABLE "access_requests" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "requestedScope" "AccessRequestScope" NOT NULL,
  "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "rejectionReason" TEXT,
  "metadata" JSONB,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "approvedUserId" TEXT,
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_requests_institutionId_status_requestedScope_idx" ON "access_requests"("institutionId", "status", "requestedScope");
CREATE INDEX "access_requests_email_idx" ON "access_requests"("email");
CREATE INDEX "access_requests_phone_idx" ON "access_requests"("phone");

ALTER TABLE "access_requests"
  ADD CONSTRAINT "access_requests_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_requests"
  ADD CONSTRAINT "access_requests_approvedUserId_fkey"
  FOREIGN KEY ("approvedUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_requests"
  ADD CONSTRAINT "access_requests_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Phone OTP challenges
CREATE TABLE "phone_otp_challenges" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT,
  "scope" "LoginScope" NOT NULL,
  "phone" TEXT NOT NULL,
  "twilioSid" TEXT,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resendAfter" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "phone_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "phone_otp_challenges_institutionId_phone_createdAt_idx" ON "phone_otp_challenges"("institutionId", "phone", "createdAt");
CREATE INDEX "phone_otp_challenges_userId_idx" ON "phone_otp_challenges"("userId");

ALTER TABLE "phone_otp_challenges"
  ADD CONSTRAINT "phone_otp_challenges_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "phone_otp_challenges"
  ADD CONSTRAINT "phone_otp_challenges_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
