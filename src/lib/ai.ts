import OpenAI from "openai";
import { AIAnalysis, ReleasePackage } from "./types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    impactClassification: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          reason: { type: "string" },
          affectedGroups: { type: "array", items: { type: "string" } }
        },
        required: ["category", "reason", "affectedGroups"]
      }
    },
    missingInformation: {
      type: "array",
      items: { type: "string" }
    },
    unsupportedClaims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          claim: { type: "string" },
          reason: { type: "string" }
        },
        required: ["claim", "reason"]
      }
    },
    risks: {
      type: "array",
      items: { type: "string" }
    },
    internalBrief: { type: "string" },
    clientBrief: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          statement: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
          supported: { type: "boolean" },
          reason: { type: "string" }
        },
        required: ["statement", "evidenceIds", "supported", "reason"]
      }
    }
  },
  required: [
    "impactClassification",
    "missingInformation",
    "unsupportedClaims",
    "risks",
    "internalBrief",
    "clientBrief",
    "evidence"
  ]
};

function numberedEvidence(pkg: ReleasePackage) {
  const lines: { id: string; type: string; text: string }[] = [];

  const add = (type: string, values: string[]) => {
    values.forEach((text, index) => {
      lines.push({
        id: `${type.toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
        type,
        text
      });
    });
  };

  add("feature", pkg.completedFeatures);
  add("bug", pkg.bugFixes);
  add("behavior", pkg.changedBehaviour);
  add("qa", pkg.qaSummary);
  add("limitation", pkg.knownLimitations);
  add("config", pkg.migrationNotes);
  add("users", pkg.affectedUserGroups);

  return lines;
}

export async function analyzeRelease(pkg: ReleasePackage): Promise<AIAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const evidence = numberedEvidence(pkg);

  const instructions = `
You are a careful Release Communication and Readiness Assistant.

Use ONLY the supplied release package and evidence list. Do not use outside facts.

Tasks:
1. Classify changes by user impact.
2. Identify missing information that a reviewer should clarify.
3. Detect claims that are not directly supported by supplied QA evidence.
4. Generate an internal technical release brief.
5. Generate a non-technical client/stakeholder release brief.
6. Identify concrete risks and limitations.
7. Cite important statements using evidenceIds from the supplied evidence list.

Grounding rules:
- Never invent test results, performance numbers, security claims, deployment status, or user outcomes.
- A release item is not QA evidence. For claims about testing or validation, use QA evidence IDs.
- If evidence is insufficient, mark supported=false and explain why.
- Do not approve or reject the release.
- Do not recommend deployment.
- Keep the client brief understandable and avoid internal implementation details unless they matter to the client.
- Every important statement in the briefs should be traceable to evidence IDs where possible.

Impact categories:
LOW = limited user impact and low workflow disruption.
MEDIUM = meaningful change for a defined group.
HIGH = broad or important workflow impact, configuration risk, or potentially disruptive behavior.
CRITICAL = potentially severe user/business impact based only on supplied evidence.

Evidence:
${JSON.stringify(evidence, null, 2)}

Release package:
${JSON.stringify(pkg, null, 2)}
`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-6-luna",
    instructions,
    input: "Analyze the release package and return the requested structured result.",
    text: {
      format: {
        type: "json_schema",
        name: "release_analysis",
        strict: true,
        schema
      }
    }
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(response.output_text) as AIAnalysis;
}