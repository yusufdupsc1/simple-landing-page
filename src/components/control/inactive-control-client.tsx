"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  School,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { showMacStatusToast } from "@/components/ui/macos-toast";
import { setStudentStatus } from "@/server/actions/students";
import { setTeacherStatus } from "@/server/actions/teachers";
import { setClassActive, setSubjectActive } from "@/server/actions/classes";

type InactiveStudent = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string | null;
  updatedAt: string | null;
};

type InactiveTeacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  updatedAt: string | null;
};

type InactiveClass = {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentCount: number;
  updatedAt: string | null;
};

type InactiveSubject = {
  id: string;
  name: string;
  code: string;
  teacherCount: number;
  updatedAt: string | null;
};

type Counter = {
  active: number;
  inactive: number;
};

interface InactiveControlClientProps {
  students: InactiveStudent[];
  teachers: InactiveTeacher[];
  classes: InactiveClass[];
  subjects: InactiveSubject[];
  counts: {
    students: Counter;
    teachers: Counter;
    classes: Counter;
    subjects: Counter;
  };
}

function SummaryCard({
  label,
  icon: Icon,
  count,
  activeCount,
}: {
  label: string;
  icon: React.ElementType;
  count: number;
  activeCount: number;
}) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold tracking-tight">{count.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">
          Inactive now • {activeCount.toLocaleString()} active
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      No inactive {label.toLowerCase()} found.
    </div>
  );
}

export function InactiveControlClient({
  students,
  teachers,
  classes,
  subjects,
  counts,
}: InactiveControlClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleReactivateStudent = (id: string) => {
    startTransition(async () => {
      const res = await setStudentStatus(id, "ACTIVE");
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      showMacStatusToast({ entity: "Student", status: "ACTIVE" });
      router.refresh();
    });
  };

  const handleReactivateTeacher = (id: string) => {
    startTransition(async () => {
      const res = await setTeacherStatus(id, "ACTIVE");
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      showMacStatusToast({ entity: "Teacher", status: "ACTIVE" });
      router.refresh();
    });
  };

  const handleReactivateClass = (id: string) => {
    startTransition(async () => {
      const res = await setClassActive(id, true);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      showMacStatusToast({ entity: "Class", status: "ACTIVE" });
      router.refresh();
    });
  };

  const handleReactivateSubject = (id: string) => {
    startTransition(async () => {
      const res = await setSubjectActive(id, true);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      showMacStatusToast({ entity: "Subject", status: "ACTIVE" });
      router.refresh();
    });
  };

  const totalInactive =
    counts.students.inactive +
    counts.teachers.inactive +
    counts.classes.inactive +
    counts.subjects.inactive;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inactive Control Center"
        description="Find archived records and restore them instantly."
        total={totalInactive}
        totalLabel="inactive items"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Students"
          icon={GraduationCap}
          count={counts.students.inactive}
          activeCount={counts.students.active}
        />
        <SummaryCard
          label="Teachers"
          icon={Users}
          count={counts.teachers.inactive}
          activeCount={counts.teachers.active}
        />
        <SummaryCard
          label="Classes"
          icon={School}
          count={counts.classes.inactive}
          activeCount={counts.classes.active}
        />
        <SummaryCard
          label="Subjects"
          icon={BookOpen}
          count={counts.subjects.inactive}
          activeCount={counts.subjects.active}
        />
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-1">
          <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Students ({counts.students.inactive})
          </TabsTrigger>
          <TabsTrigger value="teachers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Teachers ({counts.teachers.inactive})
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Classes ({counts.classes.inactive})
          </TabsTrigger>
          <TabsTrigger value="subjects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Subjects ({counts.subjects.inactive})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          {students.length === 0 ? (
            <EmptyState label="Students" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{student.firstName} {student.lastName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{student.studentId}</td>
                        <td className="px-4 py-3 text-muted-foreground">{student.className ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-500/10 text-red-600">Inactive</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.updatedAt ? formatDate(student.updatedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateStudent(student.id)}
                            disabled={pending}
                          >
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="teachers">
          {teachers.length === 0 ? (
            <EmptyState label="Teachers" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teacher</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specialization</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{teacher.firstName} {teacher.lastName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{teacher.teacherId}</td>
                        <td className="px-4 py-3 text-muted-foreground">{teacher.specialization ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-500/10 text-red-600">Inactive</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {teacher.updatedAt ? formatDate(teacher.updatedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateTeacher(teacher.id)}
                            disabled={pending}
                          >
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="classes">
          {classes.length === 0 ? (
            <EmptyState label="Classes" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grade/Section</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {classes.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{classItem.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{classItem.grade}-{classItem.section}</td>
                        <td className="px-4 py-3 text-muted-foreground">{classItem.studentCount}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-500/10 text-red-600">Inactive</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {classItem.updatedAt ? formatDate(classItem.updatedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateClass(classItem.id)}
                            disabled={pending}
                          >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subjects">
          {subjects.length === 0 ? (
            <EmptyState label="Subjects" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teachers</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{subject.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{subject.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{subject.teacherCount}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-500/10 text-red-600">Inactive</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {subject.updatedAt ? formatDate(subject.updatedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivateSubject(subject.id)}
                            disabled={pending}
                          >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
