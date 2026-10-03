import { NextRequest, NextResponse } from "next/server";
import { analyzeRelease } from "@/lib/ai";
import { cleanPackage, validateReleasePackage } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pkg = cleanPackage(body);
    const validation = validateReleasePackage(pkg);
    const analysis = await analyzeRelease(pkg);

    return NextResponse.json({ packageData: pkg, validation, analysis });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}