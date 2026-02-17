import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            firstName,
            lastName,
            admissionNo,
            rollNo,
            classId,
            gender,
            dateOfBirth,
            phone,
            email,
            guardianName,
            guardianPhone,
            guardianRelation,
        } = body;

        const student = await prisma.student.create({
            data: {
                firstName,
                lastName,
                admissionNo,
                rollNo,
                classId,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                phone,
                email,
                guardianName,
                guardianPhone,
                guardianRelation,
                status: "active",
            },
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("[STUDENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const students = await prisma.student.findMany({
            include: {
                class: true,
            },
            orderBy: {
                admissionDate: "desc",
            },
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
