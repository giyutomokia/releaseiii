import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ReleasePackage } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "Untitled Release");
    const packageData = body.packageData as ReleasePackage;
    const aiAnalysis = body.aiAnalysis ?? null;

    const { data: release, error: releaseError } = await supabaseAdmin
      .from("releases")
      .insert({ name })
      .select()
      .single();

    if (releaseError) throw releaseError;

    const { data: version, error: versionError } = await supabaseAdmin
      .from("release_versions")
      .insert({
        release_id: release.id,
        version_number: 1,
        package_data: packageData,
        ai_analysis: aiAnalysis,
        reviewed_internal_brief: aiAnalysis?.internalBrief ?? null,
        reviewed_client_brief: aiAnalysis?.clientBrief ?? null,
        status: "AI_GENERATED"
      })
      .select()
      .single();

    if (versionError) throw versionError;

    await supabaseAdmin.from("review_history").insert({
      release_version_id: version.id,
      action: "GENERATED",
      content: aiAnalysis
    });

    return NextResponse.json({ release, version });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save release" },
      { status: 500 }
    );
  }
}