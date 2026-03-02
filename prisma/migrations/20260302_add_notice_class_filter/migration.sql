ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "classId" TEXT;

CREATE INDEX IF NOT EXISTS "announcements_classId_idx"
  ON "announcements"("classId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'announcements_classId_fkey'
  ) THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "classes"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
