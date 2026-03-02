import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getStudentById } from "@/server/actions/students";
import { getCommonDict, normalizeLocale } from "@/lib/i18n/getDict";
import { tFromDict } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Student Details",
};

interface StudentDetailsPageProps {
  params: Promise<{ id: string }>;
}

function formatLocalizedDate(value: string | null, locale: "bn" | "en") {
  if (!value) return null;
  return new Date(value).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  const session = await auth();
  const user = session?.user as { institutionId?: string } | undefined;
  if (!user?.institutionId) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("locale")?.value);
  const dict = getCommonDict(locale);
  const fallback = getCommonDict("en");
  const t = (key: string) => tFromDict(key, dict, fallback);
  const na = t("not_available");
  const displayNameEn = student.studentNameEn ?? `${student.firstName} ${student.lastName}`.trim();
  const displayNameBn = student.studentNameBn ?? null;

  const guardian = student.parents[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Link href="/dashboard/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("back_to_students")}
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("student_details")}</h1>
            <p className="text-sm text-muted-foreground">
              {displayNameEn} • {student.studentId}
            </p>
          </div>
          <Badge variant="outline">{student.status}</Badge>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("student_information")}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{t("student_name_en")}:</span> {displayNameEn || na}</p>
          <p><span className="text-muted-foreground">{t("student_name_bn")}:</span> {displayNameBn ?? na}</p>
          <p><span className="text-muted-foreground">{t("class")}:</span> {student.class?.name ?? na}</p>
          <p><span className="text-muted-foreground">{t("section")}:</span> {student.class?.section ?? na}</p>
          <p><span className="text-muted-foreground">{t("roll")}:</span> {student.rollNo ?? na}</p>
          <p><span className="text-muted-foreground">{t("status")}:</span> {student.status}</p>
          <p><span className="text-muted-foreground">{t("joined_on")}:</span> {formatLocalizedDate(student.createdAt, locale) ?? na}</p>
          <p><span className="text-muted-foreground">{t("date_of_birth")}:</span> {formatLocalizedDate(student.dateOfBirth, locale) ?? na}</p>
          <p><span className="text-muted-foreground">{t("gender")}:</span> {student.gender ?? na}</p>
          <p><span className="text-muted-foreground">{t("phone")}:</span> {student.phone ?? na}</p>
          <p><span className="text-muted-foreground">{t("village")}:</span> {student.village ?? na}</p>
          <p><span className="text-muted-foreground">{t("ward")}:</span> {student.ward ?? na}</p>
          <p><span className="text-muted-foreground">{t("upazila")}:</span> {student.upazila ?? na}</p>
          <p><span className="text-muted-foreground">{t("district")}:</span> {student.district ?? na}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">{t("address")}:</span> {student.address ?? na}</p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("identity_information")}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{t("guardian_name")}:</span> {student.guardianName ?? na}</p>
          <p><span className="text-muted-foreground">{t("father_name")}:</span> {student.fatherName ?? na}</p>
          <p><span className="text-muted-foreground">{t("mother_name")}:</span> {student.motherName ?? na}</p>
          <p><span className="text-muted-foreground">{t("guardian_phone")}:</span> {student.guardianPhone ?? na}</p>
          <p><span className="text-muted-foreground">{t("birth_reg_no")}:</span> {student.birthRegNo ?? na}</p>
          <p><span className="text-muted-foreground">{t("nid_no")}:</span> {student.nidNo ?? na}</p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("guardian_information")}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">{t("guardian")}:</span>{" "}
            {student.guardianName ?? (guardian ? `${guardian.firstName} ${guardian.lastName}` : na)}
          </p>
          <p><span className="text-muted-foreground">{t("phone")}:</span> {student.guardianPhone ?? guardian?.phone ?? na}</p>
        </div>
      </section>
    </div>
  );
}
