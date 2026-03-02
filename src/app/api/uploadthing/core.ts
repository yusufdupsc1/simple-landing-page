// src/app/api/uploadthing/core.ts
import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/lib/db";

const f = createUploadthing();

const handleAuth = async () => {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId) {
    throw new Error("Unauthorized");
  }

  return { userId: user.id, institutionId: user.institutionId };
};

export const ourFileRouter = {
  studentPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, institutionId } = await handleAuth();
      return { userId, institutionId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { institutionId } = metadata;

      await db.auditLog.create({
        data: {
          action: "UPLOAD",
          entity: "StudentPhoto",
          entityId: file.key,
          newValues: {
            url: file.url,
            name: file.name,
            size: file.size,
          },
          userId: metadata.userId,
          institutionId,
        },
      });

      return { url: file.url, key: file.key };
    }),

  teacherPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, institutionId } = await handleAuth();
      return { userId, institutionId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { institutionId } = metadata;

      await db.auditLog.create({
        data: {
          action: "UPLOAD",
          entity: "TeacherPhoto",
          entityId: file.key,
          newValues: {
            url: file.url,
            name: file.name,
            size: file.size,
          },
          userId: metadata.userId,
          institutionId,
        },
      });

      return { url: file.url, key: file.key };
    }),

  institutionLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, institutionId } = await handleAuth();
      return { userId, institutionId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.institution.update({
        where: { id: metadata.institutionId },
        data: { logo: file.url },
      });

      return { url: file.url, key: file.key };
    }),

  document: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    image: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { userId, institutionId } = await handleAuth();
      return { userId, institutionId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
