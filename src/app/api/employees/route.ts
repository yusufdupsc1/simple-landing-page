import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            firstName,
            lastName,
            employeeId,
            designation,
            department,
            gender,
            dateOfBirth,
            phone,
            email,
            baseSalary,
            joiningDate,
        } = body;

        const employee = await prisma.employee.create({
            data: {
                firstName,
                lastName,
                employeeId,
                designation,
                department,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                phone,
                email,
                baseSalary: parseFloat(baseSalary),
                joiningDate: new Date(joiningDate),
                status: "active",
            },
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error("[EMPLOYEES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: {
                firstName: "asc",
            },
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error("[EMPLOYEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
