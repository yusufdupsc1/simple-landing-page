"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toIsoDate } from "@/lib/server/serializers";

const PRIMARY_NOTICE_GRADES = new Set(["1", "2", "3", "4", "5"]);

const NoticeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  body: z.string().trim().min(1, "Body is required").max(5000),
  publishDate: z.string().min(1, "Publish date is required"),
  classId: z.string().optional().or(z.literal("")),
});

export type NoticeFormData = z.infer<typeof NoticeSchema>;

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

function canCreateNotice(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF", "TEACHER"].includes(role);
}

async function resolveNoticeClassId(institutionId: string, classId?: string) {
  if (!classId) return { success: true as const, classId: null as string | null };

  const classroom = await db.class.findFirst({
    where: {
      id: classId,
      institutionId,
      isActive: true,
    },
    select: {
      id: true,
      grade: true,
    },
  });

  if (!classroom) {
    return { success: false as const, error: "Class not found." };
  }

  if (!PRIMARY_NOTICE_GRADES.has(classroom.grade)) {
    return { success: false as const, error: "Notice class filter supports Class 1 to 5 only." };
  }

  return { success: true as const, classId: classroom.id };
}

export async function createNotice(
  formData: NoticeFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId, role } = await getAuthContext();

    if (!canCreateNotice(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = NoticeSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const publishDate = new Date(data.publishDate);
    publishDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(publishDate.getTime())) {
      return { success: false, error: "Invalid publish date." };
    }

    const classResolution = await resolveNoticeClassId(institutionId, data.classId);
    if (!classResolution.success) {
      return { success: false, error: classResolution.error };
    }
    const resolvedClassId = classResolution.classId;

    const notice = await db.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          title: data.title,
          content: data.body,
          priority: "NORMAL",
          targetAudience: ["ALL"],
          publishedAt: publishDate,
          classId: resolvedClassId,
          institutionId,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_NOTICE",
          entity: "Announcement",
          entityId: created.id,
          newValues: {
            title: data.title,
            classId: resolvedClassId,
            publishDate: publishDate.toISOString(),
          },
          userId,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/notices");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: { id: notice.id } };
  } catch (error) {
    console.error("[CREATE_NOTICE]", error);
    return { success: false, error: "Failed to create notice." };
  }
}

export async function updateNotice(
  noticeId: string,
  formData: NoticeFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { institutionId, userId, role } = await getAuthContext();

    if (!canCreateNotice(role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const parsed = NoticeSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const existing = await db.announcement.findFirst({
      where: {
        id: noticeId,
        institutionId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Notice not found." };
    }

    const data = parsed.data;
    const publishDate = new Date(data.publishDate);
    publishDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(publishDate.getTime())) {
      return { success: false, error: "Invalid publish date." };
    }

    const classResolution = await resolveNoticeClassId(institutionId, data.classId);
    if (!classResolution.success) {
      return { success: false, error: classResolution.error };
    }
    const resolvedClassId = classResolution.classId;

    await db.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id: noticeId },
        data: {
          title: data.title,
          content: data.body,
          publishedAt: publishDate,
          classId: resolvedClassId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE_NOTICE",
          entity: "Announcement",
          entityId: noticeId,
          newValues: {
            title: data.title,
            classId: resolvedClassId,
            publishDate: publishDate.toISOString(),
          },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/notices");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: { id: noticeId } };
  } catch (error) {
    console.error("[UPDATE_NOTICE]", error);
    return { success: false, error: "Failed to update notice." };
  }
}

export async function getNotices({
  classId = "",
  limit = 100,
}: {
  classId?: string;
  limit?: number;
} = {}) {
  const { institutionId } = await getAuthContext();

  const where: Record<string, unknown> = {
    institutionId,
    ...(classId ? { classId } : {}),
  };

  const notices = await db.announcement.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
      class: {
        select: {
          id: true,
          name: true,
          grade: true,
          section: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.content,
    publishedAt: toIsoDate(notice.publishedAt),
    class: notice.class,
  }));
}
