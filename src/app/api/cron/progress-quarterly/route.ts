import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireCronSecret } from "@/lib/api/cron-auth";
import {
  generatePeriodicRecords,
  PERIOD_RECORD_BUNDLES,
} from "@/server/services/student-records/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  try {
    const result = await generatePeriodicRecords({
      periodType: "QUARTERLY",
      recordTypes: PERIOD_RECORD_BUNDLES.QUARTERLY,
    });

    return apiOk(result, { job: "progress-quarterly" });
  } catch (error) {
    return apiError(
      500,
      "CRON_FAILED",
      "Failed to generate quarterly progress",
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    );
  }
}

// Vercel Cron sends GET requests.
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
