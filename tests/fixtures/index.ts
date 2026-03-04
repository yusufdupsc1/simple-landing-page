import { faker } from "@faker-js/faker";
import type {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  Institution,
  Fee,
  Payment,
  Attendance,
  Grade,
  Event,
  Announcement,
  AuditLog,
  Role,
  Plan,
  Gender,
  StudentStatus,
  EmployeeStatus,
  AttendanceStatus,
  FeeType,
  FeeStatus,
  PaymentMethod,
} from "@prisma/client";

// ============================================
// FIXTURE GENERATORS
// ============================================

// Institution fixtures
export function createInstitutionFixture(
  overrides: Partial<Institution> = {},
): Institution {
  return {
    id: faker.string.uuid(),
    name: "dhadash-demo Academy",
    slug: "dhadash-demo",
    email: "admin@school.edu",
    phone: "+8801700000000",
    address: "Dhaka, Bangladesh",
    city: "Dhaka",
    country: "BD",
    timezone: "Asia/Dhaka",
    currency: "BDT",
    logo: null,
    plan: "PROFESSIONAL" as Plan,
    planExpiry: faker.date.future({ years: 1 }),
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// User fixtures
export function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.string.alphanumeric(60), // hashed password placeholder
    role: "ADMIN" as Role,
    isActive: true,
    emailVerified: faker.date.past(),
    image: null,
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Student fixtures
export function createStudentFixture(
  overrides: Partial<Student> = {},
): Student {
  const bdFirstNames = [
    "Ayaan",
    "Arisha",
    "Nabil",
    "Sadia",
    "Rafi",
    "Nafisa",
    "Tahmid",
    "Anika",
  ];
  const bdLastNames = [
    "Rahman",
    "Ahmed",
    "Hossain",
    "Islam",
    "Karim",
    "Khan",
    "Sarker",
    "Akter",
  ];
  const firstName = faker.helpers.arrayElement(bdFirstNames);
  const lastName = faker.helpers.arrayElement(bdLastNames);

  return {
    id: faker.string.uuid(),
    studentId: `STU-${faker.date.year()}-${faker.string.numeric(4)}`,
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      domain: "student.school.edu",
    }),
    gender: "MALE" as Gender,
    dateOfBirth: faker.date.birthdate({ min: 10, max: 18, mode: "age" }),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: "Dhaka",
    country: "Bangladesh",
    enrollmentDate: faker.date.past(),
    graduationDate: null,
    status: "ACTIVE" as StudentStatus,
    bloodGroup: null,
    classId: faker.string.uuid(),
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Teacher fixtures
export function createTeacherFixture(
  overrides: Partial<Teacher> = {},
): Teacher {
  const bdFirstNames = [
    "Fahim",
    "Nusrat",
    "Rakib",
    "Sharmin",
    "Mahmud",
    "Tanjina",
  ];
  const bdLastNames = [
    "Hasan",
    "Jahan",
    "Hossain",
    "Akter",
    "Rahman",
    "Sultana",
  ];
  const firstName = faker.helpers.arrayElement(bdFirstNames);
  const lastName = faker.helpers.arrayElement(bdLastNames);

  return {
    id: faker.string.uuid(),
    teacherId: `TCH-${faker.date.year()}-${faker.string.numeric(3)}`,
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      domain: "school.com",
    }),
    gender: "MALE" as Gender,
    dateOfBirth: faker.date.birthdate({ min: 25, max: 65, mode: "age" }),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    status: "ACTIVE" as EmployeeStatus,
    salary: faker.number.int({ min: 40000, max: 100000 }),
    specialization: faker.helpers.arrayElement([
      "Mathematics",
      "General Science",
      "English",
      "Bangla",
      "Bangladesh and Global Studies",
      "Religion",
    ]),
    qualification: "B.Ed",
    joiningDate: faker.date.past({ years: 5 }),
    institutionId: faker.string.uuid(),
    userId: null,
    photo: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Class fixtures
export function createClassFixture(overrides: Partial<Class> = {}): Class {
  const classes = [
    { name: "Pre-Primary", grade: "PP", section: "A" },
    { name: "Class One", grade: "1", section: "A" },
    { name: "Class Two", grade: "2", section: "A" },
    { name: "Class Three", grade: "3", section: "A" },
    { name: "Class Four", grade: "4", section: "A" },
    { name: "Class Five", grade: "5", section: "A" },
  ];
  const selected = faker.helpers.arrayElement(classes);

  return {
    id: faker.string.uuid(),
    name: selected.name,
    grade: selected.grade,
    section: selected.section,
    capacity: faker.number.int({ min: 20, max: 40 }),
    roomNumber: `Room ${faker.number.int({ min: 101, max: 999 })}`,
    academicYear: `${faker.date.year()}-${faker.date.year() + 1}`,
    isActive: true,
    teacherId: null,
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Subject fixtures
export function createSubjectFixture(
  overrides: Partial<Subject> = {},
): Subject {
  const subjectMap = [
    { name: "Bangla", code: "BAN" },
    { name: "English", code: "ENG" },
    { name: "Mathematics", code: "MTH" },
    { name: "General Science", code: "GSC" },
    { name: "Bangladesh and Global Studies", code: "BGS" },
    { name: "Religion", code: "REL" },
  ];
  const subject = faker.helpers.arrayElement(subjectMap);

  return {
    id: faker.string.uuid(),
    name: subject.name,
    code: subject.code,
    description: faker.lorem.sentence(),
    credits: faker.number.int({ min: 1, max: 4 }),
    isCore: faker.datatype.boolean(),
    isActive: true,
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Fee fixtures
export function createFeeFixture(overrides: Partial<Fee> = {}): Fee {
  return {
    id: faker.string.uuid(),
    title:
      faker.helpers.arrayElement([
        "Tuition Fee",
        "Library Fee",
        "Sports Fee",
        "Lab Fee",
      ]) + ` - ${faker.helpers.arrayElement(["Term 1", "Term 2", "Term 3"])}`,
    amount: faker.number.int({ min: 500, max: 5000 }),
    dueDate: faker.date.future({ years: 1 }),
    term: faker.helpers.arrayElement(["Term 1", "Term 2", "Term 3"]),
    academicYear: `${faker.date.year()}-${faker.date.year() + 1}`,
    feeType: "TUITION" as FeeType,
    status: "UNPAID" as FeeStatus,
    studentId: faker.string.uuid(),
    classId: faker.string.uuid(),
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Payment fixtures
export function createPaymentFixture(
  overrides: Partial<Payment> = {},
): Payment {
  return {
    id: faker.string.uuid(),
    amount: faker.number.int({ min: 100, max: 5000 }),
    method: "CASH" as PaymentMethod,
    transactionRef: `TXN-${faker.string.alphanumeric(10).toUpperCase()}`,
    receiptNumber: `RCP-${Date.now()}-${faker.string.numeric(4)}`,
    paidAt: faker.date.recent(),
    notes: faker.lorem.sentence(),
    feeId: faker.string.uuid(),
    institutionId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  };
}

// Attendance fixtures
export function createAttendanceFixture(
  overrides: Partial<Attendance> = {},
): Attendance {
  return {
    id: faker.string.uuid(),
    date: faker.date.recent(),
    status: faker.helpers.arrayElement([
      "PRESENT",
      "ABSENT",
      "LATE",
      "EXCUSED",
    ]) as AttendanceStatus,
    studentId: faker.string.uuid(),
    classId: faker.string.uuid(),
    institutionId: faker.string.uuid(),
    remarks: null,
    markedAt: faker.date.recent(),
    ...overrides,
  };
}

// Grade fixtures
export function createGradeFixture(overrides: Partial<Grade> = {}): Grade {
  const score = faker.number.int({ min: 40, max: 100 });
  return {
    id: faker.string.uuid(),
    score,
    maxScore: 100,
    percentage: score,
    letterGrade: getLetterGrade(score),
    term:
      faker.helpers.arrayElement(["Term 1", "Term 2", "Term 3"]) +
      ` ${faker.date.year()}`,
    remarks: score >= 60 ? "Good progress" : "Needs improvement",
    studentId: faker.string.uuid(),
    subjectId: faker.string.uuid(),
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Event fixtures
export function createEventFixture(overrides: Partial<Event> = {}): Event {
  return {
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement([
      "Annual Sports Day",
      "Science Fair",
      "Parent-Teacher Conference",
      "Mid-Term Exams",
      "Cultural Fest",
    ]),
    description: faker.lorem.paragraph(),
    startDate: faker.date.future({ years: 1 }),
    endDate: faker.date.future({ years: 1 }),
    location: faker.location.room(),
    type: faker.helpers.arrayElement([
      "ACADEMIC",
      "SPORTS",
      "CULTURAL",
      "HOLIDAY",
      "EXAM",
      "GENERAL",
    ]),
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Announcement fixtures
export function createAnnouncementFixture(
  overrides: Partial<Announcement> = {},
): Announcement {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    content: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(["LOW", "NORMAL", "HIGH", "URGENT"]),
    targetAudience: [
      faker.helpers.arrayElement(["ALL", "STUDENTS", "TEACHERS", "PARENTS"]),
    ],
    publishedAt: faker.date.recent(),
    expiresAt: faker.datatype.boolean()
      ? faker.date.future({ years: 1 })
      : null,
    institutionId: faker.string.uuid(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// AuditLog fixtures
export function createAuditLogFixture(
  overrides: Partial<AuditLog> = {},
): AuditLog {
  return {
    id: faker.string.uuid(),
    action: faker.helpers.arrayElement([
      "CREATE",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "PAYMENT",
    ]),
    entity: faker.helpers.arrayElement([
      "Student",
      "Teacher",
      "Class",
      "Fee",
      "Payment",
      "Grade",
    ]),
    entityId: faker.string.uuid(),
    oldValues: null,
    newValues: {},
    ipAddress: faker.internet.ipv4(),
    userAgent: faker.internet.userAgent(),
    userId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLetterGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// ============================================
// BATCH GENERATORS
// ============================================

export function generateStudents(
  count: number,
  overrides: Partial<Student> = {},
): Student[] {
  return Array.from({ length: count }, () => createStudentFixture(overrides));
}

export function generateTeachers(
  count: number,
  overrides: Partial<Teacher> = {},
): Teacher[] {
  return Array.from({ length: count }, () => createTeacherFixture(overrides));
}

export function generateClasses(
  count: number,
  overrides: Partial<Class> = {},
): Class[] {
  return Array.from({ length: count }, () => createClassFixture(overrides));
}

export function generateFees(
  count: number,
  overrides: Partial<Fee> = {},
): Fee[] {
  return Array.from({ length: count }, () => createFeeFixture(overrides));
}

export function generatePayments(
  count: number,
  overrides: Partial<Payment> = {},
): Payment[] {
  return Array.from({ length: count }, () => createPaymentFixture(overrides));
}

export function generateAttendances(
  count: number,
  overrides: Partial<Attendance> = {},
): Attendance[] {
  return Array.from({ length: count }, () =>
    createAttendanceFixture(overrides),
  );
}

export function generateGrades(
  count: number,
  overrides: Partial<Grade> = {},
): Grade[] {
  return Array.from({ length: count }, () => createGradeFixture(overrides));
}

export function generateEvents(
  count: number,
  overrides: Partial<Event> = {},
): Event[] {
  return Array.from({ length: count }, () => createEventFixture(overrides));
}

export function generateAnnouncements(
  count: number,
  overrides: Partial<Announcement> = {},
): Announcement[] {
  return Array.from({ length: count }, () =>
    createAnnouncementFixture(overrides),
  );
}
