import { RELEASE_FIELDS, ReleasePackage, ValidationResult } from "./types";

export function validateReleasePackage(pkg: ReleasePackage): ValidationResult[] {
  return RELEASE_FIELDS.map(([key, label]) => {
    const values = pkg[key] ?? [];
    const nonEmpty = values.filter((v) => v.trim().length > 0);
    return {
      section: label,
      passed: nonEmpty.length > 0,
      message:
        nonEmpty.length > 0
          ? `${label} provided`
          : `${label} is missing`
    };
  });
}

export function hasMissingRequiredSections(pkg: ReleasePackage) {
  return validateReleasePackage(pkg).some((item) => !item.passed);
}

export function cleanPackage(input: Partial<ReleasePackage>): ReleasePackage {
  const output = {} as ReleasePackage;
  for (const [key] of RELEASE_FIELDS) {
    output[key] = Array.isArray(input[key])
      ? input[key]!.map(String).map((x) => x.trim()).filter(Boolean)
      : [];
  }
  return output;
}