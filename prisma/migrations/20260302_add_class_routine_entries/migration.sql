CREATE TABLE IF NOT EXISTS "class_routine_entries" (
  "id" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "periodNo" INTEGER NOT NULL,
  "subjectName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "institutionId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  CONSTRAINT "class_routine_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "class_routine_entries_classId_dayOfWeek_periodNo_key"
  ON "class_routine_entries"("classId", "dayOfWeek", "periodNo");

CREATE INDEX IF NOT EXISTS "class_routine_entries_institutionId_classId_idx"
  ON "class_routine_entries"("institutionId", "classId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'class_routine_entries_institutionId_fkey'
  ) THEN
    ALTER TABLE "class_routine_entries"
      ADD CONSTRAINT "class_routine_entries_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'class_routine_entries_classId_fkey'
  ) THEN
    ALTER TABLE "class_routine_entries"
      ADD CONSTRAINT "class_routine_entries_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "classes"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
