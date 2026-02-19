// prisma/seed.ts
import { PrismaClient, Role, Plan, Gender, StudentStatus, EmployeeStatus, AttendanceStatus, FeeType, FeeStatus } from "@prisma/client";
import bcryptjs from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ScholasticOS database...\n");

  // ── Institution ──────────────────────────────
  const institution = await db.institution.upsert({
    where: { slug: "eskooly-demo" },
    update: {},
    create: {
      name: "Eskooly Academy",
      slug: "eskooly-demo",
      email: "admin@eskooly.com",
      phone: "+1-555-0100",
      address: "123 Academic Boulevard",
      city: "San Francisco",
      country: "US",
      timezone: "America/Los_Angeles",
      currency: "USD",
      plan: Plan.PROFESSIONAL,
    },
  });
  console.log(`✅ Institution: ${institution.name}`);

  // ── Institution Settings ─────────────────────
  await db.institutionSettings.upsert({
    where: { institutionId: institution.id },
    update: {},
    create: {
      institutionId: institution.id,
      academicYear: "2024-2025",
      termsPerYear: 3,
      emailNotifs: true,
    },
  });

  // ── Admin User ───────────────────────────────
  const hashedPassword = await bcryptjs.hash("admin123", 12);
  const adminUser = await db.user.upsert({
    where: { email: "admin@eskooly.com" },
    update: {},
    create: {
      name: "Alex Admin",
      email: "admin@eskooly.com",
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      institutionId: institution.id,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email}`);

  // ── Principal ────────────────────────────────
  const principalPwd = await bcryptjs.hash("principal123", 12);
  await db.user.upsert({
    where: { email: "principal@eskooly.com" },
    update: {},
    create: {
      name: "Dr. Sarah Chen",
      email: "principal@eskooly.com",
      password: principalPwd,
      role: Role.PRINCIPAL,
      emailVerified: new Date(),
      institutionId: institution.id,
    },
  });

  // ── Subjects ─────────────────────────────────
  const subjectData = [
    { name: "Mathematics", code: "MATH", isCore: true },
    { name: "English Language", code: "ENG", isCore: true },
    { name: "Science", code: "SCI", isCore: true },
    { name: "Social Studies", code: "SS", isCore: true },
    { name: "Computer Science", code: "CS", isCore: false },
    { name: "Physical Education", code: "PE", isCore: false },
    { name: "Art & Design", code: "ART", isCore: false },
  ];

  const subjects = await Promise.all(
    subjectData.map((s) =>
      db.subject.upsert({
        where: { institutionId_code: { institutionId: institution.id, code: s.code } },
        update: {},
        create: { ...s, institutionId: institution.id },
      })
    )
  );
  console.log(`✅ Subjects: ${subjects.length}`);

  // ── Classes ──────────────────────────────────
  const classData = [
    { name: "Grade 9A", grade: "9", section: "A" },
    { name: "Grade 9B", grade: "9", section: "B" },
    { name: "Grade 10A", grade: "10", section: "A" },
    { name: "Grade 10B", grade: "10", section: "B" },
    { name: "Grade 11A", grade: "11", section: "A" },
    { name: "Grade 12A", grade: "12", section: "A" },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      db.class.upsert({
        where: {
          institutionId_grade_section_academicYear: {
            institutionId: institution.id,
            grade: c.grade,
            section: c.section,
            academicYear: "2024-2025",
          },
        },
        update: {},
        create: {
          ...c,
          academicYear: "2024-2025",
          capacity: 30,
          institutionId: institution.id,
        },
      })
    )
  );
  console.log(`✅ Classes: ${classes.length}`);

  // ── Teachers ─────────────────────────────────
  const teacherData = [
    { firstName: "James", lastName: "Wilson", email: "j.wilson@eskooly.com", specialization: "Mathematics" },
    { firstName: "Maria", lastName: "Rodriguez", email: "m.rodriguez@eskooly.com", specialization: "Science" },
    { firstName: "David", lastName: "Kim", email: "d.kim@eskooly.com", specialization: "Computer Science" },
    { firstName: "Emily", lastName: "Thompson", email: "e.thompson@eskooly.com", specialization: "English" },
  ];

  const teachers = await Promise.all(
    teacherData.map((t, i) =>
      db.teacher.upsert({
        where: {
          institutionId_teacherId: {
            institutionId: institution.id,
            teacherId: `TCH-2024-${String(i + 1).padStart(3, "0")}`,
          },
        },
        update: {},
        create: {
          ...t,
          teacherId: `TCH-2024-${String(i + 1).padStart(3, "0")}`,
          gender: Gender.MALE,
          salary: 55000 + i * 5000,
          status: EmployeeStatus.ACTIVE,
          institutionId: institution.id,
        },
      })
    )
  );
  console.log(`✅ Teachers: ${teachers.length}`);

  // ── Students ─────────────────────────────────
  const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James",
    "Isabella", "Oliver", "Mia", "Elijah", "Charlotte", "Lucas", "Amelia"];
  const lastNames = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Martinez", "Hernandez"];

  let studentCount = 0;
  for (let c = 0; c < classes.length; c++) {
    for (let s = 0; s < 15; s++) {
      const firstName = firstNames[(c * 15 + s) % firstNames.length];
      const lastName = lastNames[(c * 15 + s) % lastNames.length];
      const sid = `STU-2024-${String(studentCount + 1).padStart(4, "0")}`;

      await db.student.upsert({
        where: { institutionId_studentId: { institutionId: institution.id, studentId: sid } },
        update: {},
        create: {
          studentId: sid,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.eskooly.com`,
          gender: s % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date(2006 + (c % 4), s % 12, (s % 28) + 1),
          status: StudentStatus.ACTIVE,
          classId: classes[c].id,
          institutionId: institution.id,
        },
      });
      studentCount++;
    }
  }
  console.log(`✅ Students: ${studentCount}`);

  // ── Attendance (last 7 days) ─────────────────
  const students = await db.student.findMany({
    where: { institutionId: institution.id },
    take: 30,
  });

  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of students) {
      const rand = Math.random();
      const status =
        rand > 0.9
          ? AttendanceStatus.ABSENT
          : rand > 0.85
          ? AttendanceStatus.LATE
          : AttendanceStatus.PRESENT;

      await db.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: {},
        create: {
          date,
          status,
          studentId: student.id,
          classId: student.classId!,
          institutionId: institution.id,
        },
      });
    }
  }
  console.log(`✅ Attendance records seeded`);

  // ── Fees ─────────────────────────────────────
  const allStudents = await db.student.findMany({
    where: { institutionId: institution.id },
    take: 50,
  });

  for (const student of allStudents) {
    const rand = Math.random();
    const status =
      rand > 0.7 ? FeeStatus.PAID : rand > 0.4 ? FeeStatus.PARTIAL : FeeStatus.UNPAID;

    await db.fee.create({
      data: {
        title: "Tuition Fee — Term 1 2024",
        amount: 1500,
        dueDate: new Date("2024-09-15"),
        term: "Term 1",
        academicYear: "2024-2025",
        feeType: FeeType.TUITION,
        status,
        studentId: student.id,
        institutionId: institution.id,
      },
    });
  }
  console.log(`✅ Fees seeded for ${allStudents.length} students`);

  // ── Events ───────────────────────────────────
  const events = [
    { title: "Annual Sports Day", startDate: new Date("2025-03-15"), type: "SPORTS" },
    { title: "Science Fair 2025", startDate: new Date("2025-04-10"), type: "ACADEMIC" },
    { title: "Parent-Teacher Conference", startDate: new Date("2025-02-28"), type: "GENERAL" },
    { title: "Mid-Term Examinations", startDate: new Date("2025-03-03"), type: "EXAM" },
  ];

  for (const e of events) {
    await db.event.create({
      data: { ...e, type: e.type as any, institutionId: institution.id },
    });
  }
  console.log(`✅ Events: ${events.length}`);

  // ── Announcements ────────────────────────────
  await db.announcement.create({
    data: {
      title: "Welcome to Academic Year 2024-2025",
      content:
        "We are excited to welcome all students and staff to another great academic year. Please review the updated school policies available in the student portal.",
      priority: "HIGH",
      targetAudience: ["ALL"],
      institutionId: institution.id,
    },
  });
  console.log(`✅ Announcements seeded`);

  console.log("\n🎉 Seeding complete!\n");
  console.log("Demo credentials:");
  console.log("  Admin:     admin@eskooly.com / admin123");
  console.log("  Principal: principal@eskooly.com / principal123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
