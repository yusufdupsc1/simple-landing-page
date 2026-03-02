ALTER TABLE "primary_exam_marks"
  ALTER COLUMN "score" DROP NOT NULL;

ALTER TABLE "primary_exam_marks"
  ADD COLUMN IF NOT EXISTS "isAbsent" BOOLEAN NOT NULL DEFAULT false;
