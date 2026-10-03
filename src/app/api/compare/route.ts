import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { versionA, versionB } = await request.json();

    const ids = [versionA, versionB].filter(Boolean);

    const { data, error } = await supabaseAdmin
      .from("release_versions")
      .select("*")
      .in("id", ids);

    if (error) throw error;

    const a = data?.find((v) => v.id === versionA);
    const b = data?.find((v) => v.id === versionB);

    if (!a || !b) {
      return NextResponse.json({ error: "Both versions are required" }, { status: 400 });
    }

    const changes: { section: string; before: string[]; after: string[] }[] = [];
    const keys = [
      "completedFeatures",
      "bugFixes",
      "changedBehaviour",
      "qaSummary",
      "knownLimitations",
      "migrationNotes",
      "affectedUserGroups"
    ];

    for (const key of keys) {
      const before = a.package_data?.[key] ?? [];
      const after = b.package_data?.[key] ?? [];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push({ section: key, before, after });
      }
    }

    const oldStatements = a.ai_analysis?.evidence ?? [];
    const newStatements = b.ai_analysis?.evidence ?? [];

    const staleStatements = oldStatements.filter((oldItem: any) => {
      const matching = newStatements.find((x: any) => x.statement === oldItem.statement);
      return oldItem.supported && !matching?.supported;
    });

    return NextResponse.json({
      from: a,
      to: b,
      changes,
      staleStatements
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Comparison failed" },
      { status: 500 }
    );
  }
}