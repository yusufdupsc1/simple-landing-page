import { prisma } from "@/lib/prisma";
import { StudentsTable } from "@/components/dashboard/students-table";

export default async function StudentsPage() {
    const [students, classes] = await Promise.all([
        prisma.student.findMany({
            include: {
                class: true,
            },
            orderBy: {
                admissionDate: "desc",
            },
        }),
        prisma.class.findMany({
            orderBy: {
                name: "asc",
            },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Students Directory</h1>
                    <p className="text-gray-500 text-sm">View and manage all students enrolled in the system.</p>
                </div>
            </div>

            <StudentsTable students={students} classes={classes} />
        </div>
    );
}
