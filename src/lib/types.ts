export const RELEASE_FIELDS = [
  ["completedFeatures", "Completed features"],
  ["bugFixes", "Bug fixes"],
  ["changedBehaviour", "Changed behaviour"],
  ["qaSummary", "QA summary / evidence"],
  ["knownLimitations", "Known limitations"],
  ["migrationNotes", "Migration / configuration notes"],
  ["affectedUserGroups", "Affected user groups"]
] as const;

export type ReleaseField = (typeof RELEASE_FIELDS)[number][0];

export type ReleasePackage = Record<ReleaseField, string[]>;

export type ValidationResult = {
  section: string;
  passed: boolean;
  message: string;
};

export type Evidence = {
  statement: string;
  evidenceIds: string[];
  supported: boolean;
  reason: string;
};

export type AIAnalysis = {
  impactClassification: {
    category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
    affectedGroups: string[];
  }[];
  missingInformation: string[];
  unsupportedClaims: {
    claim: string;
    reason: string;
  }[];
  risks: string[];
  internalBrief: string;
  clientBrief: string;
  evidence: Evidence[];
};

export type ReleaseVersion = {
  id: string;
  release_id: string;
  version_number: number;
  package_data: ReleasePackage;
  ai_analysis: AIAnalysis | null;
  reviewed_internal_brief: string | null;
  reviewed_client_brief: string | null;
  status: "DRAFT" | "AI_GENERATED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  created_at: string;
};