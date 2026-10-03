import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanPackage } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from("releases")
      .select("*, release_versions(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data: latest, error: latestError } = await supabaseAdmin
      .from("release_versions")
      .select("version_number")
      .eq("release_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    const versionNumber = (latest?.version_number ?? 0) + 1;
    const packageData = cleanPackage(body.packageData);
    const aiAnalysis = body.aiAnalysis ?? null;

    const { data: version, error } = await supabaseAdmin
      .from("release_versions")
      .insert({
        release_id: id,
        version_number: versionNumber,
        package_data: packageData,
        ai_analysis: aiAnalysis,
        reviewed_internal_brief: aiAnalysis?.internalBrief ?? null,
        reviewed_client_brief: aiAnalysis?.clientBrief ?? null,
        status: "AI_GENERATED"
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("review_history").insert({
      release_version_id: version.id,
      action: "GENERATED",
      content: aiAnalysis
    });

    return NextResponse.json(version);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create version" },
      { status: 500 }
    );
  }
}