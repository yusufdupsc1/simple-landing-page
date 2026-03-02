CREATE TABLE IF NOT EXISTS "primary_exams" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "subjectsText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "institutionId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  CONSTRAINT "primary_exams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "primary_exams_institutionId_classId_year_idx"
  ON "primary_exams"("institutionId", "classId", "year");

CREATE TABLE IF NOT EXISTS "primary_exam_marks" (
  "id" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "institutionId" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  CONSTRAINT "primary_exam_marks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "primary_exam_marks_examId_studentId_subjectName_key"
  ON "primary_exam_marks"("examId", "studentId", "subjectName");

CREATE INDEX IF NOT EXISTS "primary_exam_marks_institutionId_examId_idx"
  ON "primary_exam_marks"("institutionId", "examId");

CREATE INDEX IF NOT EXISTS "primary_exam_marks_studentId_idx"
  ON "primary_exam_marks"("studentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'primary_exams_institutionId_fkey'
  ) THEN
    ALTER TABLE "primary_exams"
      ADD CONSTRAINT "primary_exams_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'primary_exams_classId_fkey'
  ) THEN
    ALTER TABLE "primary_exams"
      ADD CONSTRAINT "primary_exams_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "classes"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'primary_exam_marks_institutionId_fkey'
  ) THEN
    ALTER TABLE "primary_exam_marks"
      ADD CONSTRAINT "primary_exam_marks_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'primary_exam_marks_examId_fkey'
  ) THEN
    ALTER TABLE "primary_exam_marks"
      ADD CONSTRAINT "primary_exam_marks_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "primary_exams"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'primary_exam_marks_studentId_fkey'
  ) THEN
    ALTER TABLE "primary_exam_marks"
      ADD CONSTRAINT "primary_exam_marks_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
