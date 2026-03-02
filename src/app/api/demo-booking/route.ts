import { NextResponse } from "next/server";
import { z } from "zod";

const demoBookingSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  phone: z.string().min(6, "Phone is required"),
  preferredDate: z.string().optional(),
  note: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = demoBookingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Lightweight handler for now; wiring to persistent CRM/DB can be added later.
    console.info("[demo-booking]", parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "ডেমো অনুরোধ গ্রহণ করা হয়েছে। আমরা দ্রুত যোগাযোগ করব।",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[demo-booking]", error);
    return NextResponse.json(
      { error: "Failed to submit demo request" },
      { status: 500 },
    );
  }
}

