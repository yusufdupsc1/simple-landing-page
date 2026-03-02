import { z } from "zod";

export const StudentCreateSchema = z.object({
  firstName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().max(50).optional().or(z.literal("")),
  studentNameBn: z.string().max(120).optional().or(z.literal("")),
  studentNameEn: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  classId: z.string().optional(),
  rollNo: z.string().max(20).optional().or(z.literal("")),
  guardianName: z.string().max(120).optional().or(z.literal("")),
  address: z.string().optional(),
  village: z.string().max(120).optional().or(z.literal("")),
  ward: z.string().max(80).optional().or(z.literal("")),
  upazila: z.string().max(120).optional().or(z.literal("")),
  district: z.string().max(120).optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  parentRelation: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianPhone: z.string().optional(),
  birthRegNo: z.string().optional(),
  nidNo: z.string().optional(),
});

export const StudentListFiltersSchema = z.object({
  classId: z.string().default(""),
  status: z.string().default("ACTIVE"),
});

export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;
