import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const allowed = ["DRAFT", "AI_GENERATED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = String(body.status);

    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };

    if (typeof body.internalBrief === "string") {
      update.reviewed_internal_brief = body.internalBrief;
    }
    if (typeof body.clientBrief === "string") {
      update.reviewed_client_brief = body.clientBrief;
    }

    const { data, error } = await supabaseAdmin
      .from("release_versions")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("review_history").insert({
      release_version_id: id,
      action: status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "EDITED",
      content: {
        internalBrief: body.internalBrief,
        clientBrief: body.clientBrief,
        status
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review action failed" },
      { status: 500 }
    );
  }
}