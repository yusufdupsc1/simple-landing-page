import { z } from "zod";

export const ClassCreateSchema = z.object({
  name: z.string().min(1),
  grade: z.string().trim().min(1),
  section: z.string().min(1),
  capacity: z.coerce.number().min(1).max(200).default(30),
  roomNumber: z.string().optional(),
  academicYear: z.string().min(1),
  teacherId: z.string().optional(),
});

export const ClassListFiltersSchema = z.object({
  academicYear: z.string().default(""),
});

export type ClassCreateInput = z.infer<typeof ClassCreateSchema>;
