import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Gender, StudentStatus } from "@prisma/client";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const db = new PrismaClient();

const csvPath =
  process.env.BD_DEMO_CSV_PATH ||
  "/home/neo/Downloads/BD_School_60_Students_Demo_Data_2026.csv";

const institutionSlug = process.env.DEMO_INSTITUTION_SLUG || "scholaops-demo";
const TARGET_STUDENTS = 60;
const STUDENTS_PER_CLASS = 10;

const FIXED_CLASSES = [
  { name: "Pre-Primary", grade: "PP", section: "A" },
  { name: "Class One", grade: "1", section: "A" },
  { name: "Class Two", grade: "2", section: "A" },
  { name: "Class Three", grade: "3", section: "A" },
  { name: "Class Four", grade: "4", section: "A" },
  { name: "Class Five", grade: "5", section: "A" },
];

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    records.push(row);
  }

  return records;
}

function normalizeGender(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "male") return Gender.MALE;
  if (v === "female") return Gender.FEMALE;
  return null;
}

function normalizeStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "active") return StudentStatus.ACTIVE;
  if (v === "inactive") return StudentStatus.INACTIVE;
  if (v === "graduated") return StudentStatus.GRADUATED;
  if (v === "suspended") return StudentStatus.SUSPENDED;
  if (v === "expelled") return StudentStatus.EXPELLED;
  if (v === "transferred") return StudentStatus.TRANSFERRED;
  return StudentStatus.ACTIVE;
}

function safeEmailFromName(name, suffix) {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);

  return `${normalized || "guardian"}.${suffix}@noreply.scholaops.local`;
}

async function cleanInstitutionData(institutionId) {
  const students = await db.student.findMany({
    where: { institutionId },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  const fees = studentIds.length
    ? await db.fee.findMany({
        where: {
          institutionId,
          studentId: { in: studentIds },
        },
        select: { id: true },
      })
    : [];
  const feeIds = fees.map((f) => f.id);

  const classes = await db.class.findMany({
    where: { institutionId },
    select: { id: true },
  });
  const classIds = classes.map((c) => c.id);

  await db.$transaction(async (tx) => {
    if (feeIds.length) {
      await tx.payment.deleteMany({ where: { feeId: { in: feeIds } } });
    }

    if (studentIds.length) {
      await tx.studentRecord.deleteMany({ where: { studentId: { in: studentIds } } });
      await tx.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
      await tx.grade.deleteMany({ where: { studentId: { in: studentIds } } });
      await tx.parent.deleteMany({ where: { studentId: { in: studentIds } } });
    }

    if (feeIds.length) {
      await tx.fee.deleteMany({ where: { id: { in: feeIds } } });
    }

    if (classIds.length) {
      await tx.timetable.deleteMany({ where: { classId: { in: classIds } } });
    }

    if (studentIds.length) {
      await tx.student.deleteMany({ where: { id: { in: studentIds } } });
    }

    if (classIds.length) {
      await tx.class.deleteMany({ where: { id: { in: classIds } } });
    }
  });
}

async function ensureFixedClasses(institutionId, academicYear) {
  const classIds = [];

  for (const cls of FIXED_CLASSES) {
    const created = await db.class.create({
      data: {
        institutionId,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        academicYear,
        capacity: 50,
        isActive: true,
      },
    });

    classIds.push(created.id);
  }

  return classIds;
}

async function main() {
  const absoluteCsvPath = path.resolve(csvPath);
  if (!fs.existsSync(absoluteCsvPath)) {
    throw new Error(`CSV file not found: ${absoluteCsvPath}`);
  }

  const institution = await db.institution.findUnique({
    where: { slug: institutionSlug },
    select: { id: true, name: true, settings: { select: { academicYear: true } } },
  });

  if (!institution) {
    throw new Error(`Institution slug not found: ${institutionSlug}`);
  }

  const csvContent = fs.readFileSync(absoluteCsvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(csvContent);

  if (rows.length < TARGET_STUDENTS) {
    throw new Error(`CSV needs at least ${TARGET_STUDENTS} rows, found ${rows.length}`);
  }

  const selectedRows = rows.slice(0, TARGET_STUDENTS);
  if (selectedRows.length !== FIXED_CLASSES.length * STUDENTS_PER_CLASS) {
    throw new Error(
      `Import requires ${FIXED_CLASSES.length} classes x ${STUDENTS_PER_CLASS} students = ${TARGET_STUDENTS}`,
    );
  }

  console.log(`\nCleaning old student/class data for ${institution.name}...`);
  await cleanInstitutionData(institution.id);
  console.log("Done.\n");

  const academicYear = institution.settings?.academicYear || "2026-2027";
  const classIds = await ensureFixedClasses(institution.id, academicYear);

  let inserted = 0;

  for (let index = 0; index < selectedRows.length; index += 1) {
    const row = selectedRows[index];
    const classIndex = Math.floor(index / STUDENTS_PER_CLASS);
    const classId = classIds[classIndex];

    const fullName =
      String(row.Full_Name || "").trim() ||
      `${row.First_Name || ""} ${row.Last_Name || ""}`.trim();

    const guardianName = String(row.Guardian_Name || "Guardian").trim();
    const [guardianFirstName, ...guardianLastParts] = guardianName.split(/\s+/);
    const guardianLastName = guardianLastParts.join(" ") || "Guardian";

    const studentId = String(row.Student_ID || "").trim() || `STU-CSV-${index + 1}`;

    const student = await db.student.create({
      data: {
        institutionId: institution.id,
        classId,
        studentId,
        firstName:
          String(row.First_Name || "").trim() || fullName.split(" ")[0] || "Student",
        lastName:
          String(row.Last_Name || "").trim() ||
          fullName.split(" ").slice(1).join(" ") ||
          "Name",
        gender: normalizeGender(row.Gender),
        dateOfBirth: row.Date_of_Birth ? new Date(row.Date_of_Birth) : null,
        enrollmentDate: row.Admission_Date ? new Date(row.Admission_Date) : new Date(),
        status: normalizeStatus(row.Status),
        bloodGroup: String(row.Blood_Group || "") || null,
        phone: String(row.Guardian_Phone || "") || null,
        city: String(row.District || "") || null,
        country: "Bangladesh",
      },
    });

    await db.parent.create({
      data: {
        studentId: student.id,
        firstName: guardianFirstName || "Guardian",
        lastName: guardianLastName,
        relation: "Guardian",
        phone: String(row.Guardian_Phone || "") || null,
        email: safeEmailFromName(guardianName || fullName, student.studentId),
      },
    });

    inserted += 1;
  }

  console.log(`Imported ${inserted} students from ${absoluteCsvPath}`);
  console.log(`Class distribution: ${STUDENTS_PER_CLASS} x ${FIXED_CLASSES.length}`);
  console.log(`Institution: ${institution.name} (${institutionSlug})\n`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
