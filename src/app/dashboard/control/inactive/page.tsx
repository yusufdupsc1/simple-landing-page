import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toIsoDate } from "@/lib/server/serializers";
import { InactiveControlClient } from "@/components/control/inactive-control-client";

export const metadata: Metadata = {
  title: "Inactive Control",
};

const PRIVILEGED_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

export default async function InactiveControlPage() {
  const session = await auth();
  const user = session?.user as
    | { institutionId?: string; role?: string }
    | undefined;

  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  if (!PRIVILEGED_ROLES.includes(user.role ?? "")) {
    redirect("/dashboard");
  }

  const institutionId = user.institutionId;

  const [
    students,
    teachers,
    classes,
    subjects,
    studentActive,
    studentInactive,
    teacherActive,
    teacherInactive,
    classActive,
    classInactive,
    subjectActive,
    subjectInactive,
  ] = await Promise.all([
    db.student.findMany({
      where: { institutionId, status: "INACTIVE" },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
        class: { select: { name: true, grade: true, section: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.teacher.findMany({
      where: { institutionId, status: "INACTIVE" },
      select: {
        id: true,
        teacherId: true,
        firstName: true,
        lastName: true,
        specialization: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.class.findMany({
      where: { institutionId, isActive: false },
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        updatedAt: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    db.subject.findMany({
      where: { institutionId, isActive: false },
      select: {
        id: true,
        name: true,
        code: true,
        updatedAt: true,
        _count: { select: { teachers: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.student.count({ where: { institutionId, status: "ACTIVE" } }),
    db.student.count({ where: { institutionId, status: "INACTIVE" } }),
    db.teacher.count({ where: { institutionId, status: "ACTIVE" } }),
    db.teacher.count({ where: { institutionId, status: "INACTIVE" } }),
    db.class.count({ where: { institutionId, isActive: true } }),
    db.class.count({ where: { institutionId, isActive: false } }),
    db.subject.count({ where: { institutionId, isActive: true } }),
    db.subject.count({ where: { institutionId, isActive: false } }),
  ]);

  return (
    <InactiveControlClient
      students={students.map((student) => ({
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        className: student.class
          ? `${student.class.name} (${student.class.grade}-${student.class.section})`
          : null,
        updatedAt: toIsoDate(student.updatedAt),
      }))}
      teachers={teachers.map((teacher) => ({
        id: teacher.id,
        teacherId: teacher.teacherId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        specialization: teacher.specialization,
        updatedAt: toIsoDate(teacher.updatedAt),
      }))}
      classes={classes.map((classItem) => ({
        id: classItem.id,
        name: classItem.name,
        grade: classItem.grade,
        section: classItem.section,
        studentCount: classItem._count.students,
        updatedAt: toIsoDate(classItem.updatedAt),
      }))}
      subjects={subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        teacherCount: subject._count.teachers,
        updatedAt: toIsoDate(subject.updatedAt),
      }))}
      counts={{
        students: { active: studentActive, inactive: studentInactive },
        teachers: { active: teacherActive, inactive: teacherInactive },
        classes: { active: classActive, inactive: classInactive },
        subjects: { active: subjectActive, inactive: subjectInactive },
      }}
    />
  );
}
