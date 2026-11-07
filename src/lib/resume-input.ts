export const MAX_RESUME_LENGTH = 20_000;
export const MAX_JOB_LENGTH = 12_000;
export const MAX_PREFERENCE_LENGTH = 2_000;

export const PREFERENCE_IDS = [
  "target-role",
  "technical-skills",
  "achievements",
  "metrics",
  "industries",
  "resume-style",
  "experience-level",
  "career-focus",
] as const;

export interface ResumeAnswer {
  questionId: string;
  answer: string | string[];
}

export interface ResumeInput {
  resumeText: string;
  jobDescription: string;
  answers: ResumeAnswer[];
}

export class ResumeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ResumeError";
    this.status = status;
  }
}

export function parseResumeInput(value: unknown): ResumeInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ResumeError("Provide a resume to create a draft.");
  }
  const body = value as Record<string, unknown>;
  if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
    throw new ResumeError("Resume text is required.");
  }
  const resumeText = body.resumeText.trim();
  if (resumeText.length > MAX_RESUME_LENGTH) {
    throw new ResumeError(
      `Keep your resume under ${MAX_RESUME_LENGTH.toLocaleString("en-US")} characters.`,
    );
  }
  if (/\u0000|^\s*%PDF-|^PK\u0003\u0004/.test(resumeText)) {
    throw new ResumeError(
      "Paste resume text or upload a TXT file, rather than a PDF or Word file.",
    );
  }
  if (
    body.jobDescription !== undefined &&
    typeof body.jobDescription !== "string"
  ) {
    throw new ResumeError("Job description must be text.");
  }
  const jobDescription =
    (body.jobDescription as string | undefined)?.trim() || "";
  if (jobDescription.length > MAX_JOB_LENGTH) {
    throw new ResumeError("Keep the job description under 12,000 characters.");
  }
  const suppliedAnswers = body.answers === undefined ? [] : body.answers;
  if (
    !Array.isArray(suppliedAnswers) ||
    suppliedAnswers.length > PREFERENCE_IDS.length
  ) {
    throw new ResumeError("Provide a valid list of optional preferences.");
  }
  const seen = new Set<string>();
  const answers: ResumeAnswer[] = suppliedAnswers.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ResumeError("Invalid preference.");
    }
    const { questionId, answer } = item as Record<string, unknown>;
    if (
      typeof questionId !== "string" ||
      !PREFERENCE_IDS.includes(questionId as (typeof PREFERENCE_IDS)[number]) ||
      seen.has(questionId)
    ) {
      throw new ResumeError("Unknown or duplicate preference.");
    }
    seen.add(questionId);
    if (
      typeof answer !== "string" &&
      (!Array.isArray(answer) || answer.some((a) => typeof a !== "string"))
    ) {
      throw new ResumeError("Preference answers must contain text.");
    }
    const clean = Array.isArray(answer)
      ? answer.map((a) => a.trim()).filter(Boolean)
      : answer.trim();
    if (
      (Array.isArray(clean) ? clean.join(", ") : clean).length >
      MAX_PREFERENCE_LENGTH
    ) {
      throw new ResumeError("Keep each preference under 2,000 characters.");
    }
    return { questionId, answer: clean };
  });
  return { resumeText, jobDescription, answers };
}

// Matches the Premium/Pro tiers advertised by the existing pricing page.
// Supports both the legacy plan_name schema and the Stripe amount schema.
export function hasResumeAccess(
  subscription: Record<string, unknown>,
  now = Date.now(),
): boolean {
  if (subscription.status !== "active") return false;
  if (
    typeof subscription.current_period_end === "number" &&
    subscription.current_period_end * 1000 <= now
  )
    return false;
  const name =
    typeof subscription.plan_name === "string"
      ? subscription.plan_name.toLowerCase()
      : "";
  return (
    ["premium", "pro"].includes(name) ||
    (typeof subscription.amount === "number" && subscription.amount >= 1499)
  );
}
