import assert from "node:assert/strict";
import test from "node:test";
import {
  hasResumeAccess,
  MAX_RESUME_LENGTH,
  parseResumeInput,
  ResumeError,
} from "../src/lib/resume-input.ts";
import { generateResumeDraft } from "../src/lib/resume-generation.ts";

const resumeText = "Candidate\nBuilt a scheduling tool for a student club.";
const input = parseResumeInput({ resumeText });
const configured = {
  apiKey: "test-key-not-a-credential",
  model: "configured-test-model",
};
const apiError = (status: number) => (error: unknown) =>
  error instanceof ResumeError && error.status === status;

test("a first draft needs no questionnaire answers or job description", () => {
  assert.deepEqual(input, { resumeText, jobDescription: "", answers: [] });
});

test("invalid, oversized and binary resume inputs are rejected", () => {
  for (const invalid of [
    null,
    [],
    {},
    { resumeText: " " },
    { resumeText: 12 },
    { resumeText: "%PDF-1.7 binary" },
    { resumeText: "PK\u0003\u0004binary" },
    { resumeText: "a".repeat(MAX_RESUME_LENGTH + 1) },
  ]) {
    assert.throws(() => parseResumeInput(invalid), apiError(400));
  }
});

test("malformed preferences cannot become fabricated candidate context", () => {
  for (const answers of [
    null,
    "not-an-array",
    [{ questionId: "invent-experience", answer: "yes" }],
    [{ questionId: "metrics", answer: 12 }],
    [{ questionId: "metrics", answer: ["real", 12] }],
    [{ questionId: "metrics", answer: "a".repeat(2001) }],
    [
      { questionId: "metrics", answer: "10%" },
      { questionId: "metrics", answer: "20%" },
    ],
  ]) {
    assert.throws(
      () => parseResumeInput({ resumeText, answers }),
      apiError(400),
    );
  }
  assert.throws(
    () => parseResumeInput({ resumeText, jobDescription: 12 }),
    apiError(400),
  );
  assert.throws(
    () => parseResumeInput({ resumeText, jobDescription: "a".repeat(12001) }),
    apiError(400),
  );
});

test("the last optional answer and supplied facts reach generation intact", async () => {
  const refined = parseResumeInput({
    resumeText,
    jobDescription: "A product internship",
    answers: [
      { questionId: "career-focus", answer: "Operations & Efficiency" },
      { questionId: "technical-skills", answer: ["TypeScript", " SQL "] },
    ],
  });
  let requestBody: Record<string, unknown> = {};
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    requestBody = JSON.parse(init?.body as string);
    return Response.json({
      status: "completed",
      output: [
        { type: "reasoning" },
        {
          type: "message",
          content: [{ type: "output_text", text: "Grounded draft" }],
        },
      ],
    });
  };
  assert.equal(
    await generateResumeDraft(refined, { ...configured, fetcher }),
    "Grounded draft",
  );
  assert.equal(requestBody.store, false);
  assert.equal(requestBody.model, configured.model);
  const context = JSON.parse(requestBody.input as string);
  assert.equal(context.resume, resumeText);
  assert.equal(context.jobDescription, "A product internship");
  assert.deepEqual(context.optionalAnswers, refined.answers);
});

test("only complete text outputs are returned, across multiple response messages", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({
      status: "completed",
      output: [
        { type: "reasoning" },
        {
          type: "message",
          content: [{ type: "output_text", text: "First section" }],
        },
        {
          type: "message",
          content: [{ type: "output_text", text: "Second section" }],
        },
      ],
    });
  assert.equal(
    await generateResumeDraft(input, { ...configured, fetcher }),
    "First section\nSecond section",
  );
});

test("missing server configuration never calls a provider or returns a fake resume", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    throw new Error("must not call");
  };
  await assert.rejects(
    generateResumeDraft(input, { model: "test", fetcher }),
    apiError(503),
  );
  await assert.rejects(
    generateResumeDraft(input, { apiKey: "test", fetcher }),
    apiError(503),
  );
  assert.equal(called, false);
});

test("provider failures do not become demo output or expose upstream details", async () => {
  const fetcher: typeof fetch = async () =>
    new Response("private provider details", { status: 500 });
  await assert.rejects(
    generateResumeDraft(input, { ...configured, fetcher }),
    (error) =>
      apiError(502)(error) &&
      !(error as Error).message.includes("private provider"),
  );
  const busy: typeof fetch = async () =>
    new Response("limited", { status: 429 });
  await assert.rejects(
    generateResumeDraft(input, { ...configured, fetcher: busy }),
    apiError(429),
  );
  const unavailable: typeof fetch = async () => {
    throw new Error("network");
  };
  await assert.rejects(
    generateResumeDraft(input, { ...configured, fetcher: unavailable }),
    apiError(502),
  );
});

test("empty, refused, truncated and malformed responses cannot be successful drafts", async () => {
  for (const body of [
    null,
    {},
    {
      status: "incomplete",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "Cut off" }],
        },
      ],
    },
    { status: "completed", output: [null] },
    {
      status: "completed",
      output: [
        { type: "message", content: [{ type: "refusal", refusal: "No" }] },
      ],
    },
    {
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: " " }] },
      ],
    },
  ]) {
    const fetcher: typeof fetch = async () => Response.json(body);
    await assert.rejects(
      generateResumeDraft(input, { ...configured, fetcher }),
      apiError(502),
    );
  }
  const unreadable: typeof fetch = async () => new Response("not JSON");
  await assert.rejects(
    generateResumeDraft(input, { ...configured, fetcher: unreadable }),
    apiError(502),
  );
});

test("the advertised paid tiers are accepted but free, inactive and expired plans are not", () => {
  const now = Date.UTC(2026, 10, 6);
  assert.equal(
    hasResumeAccess({ status: "active", plan_name: "premium" }, now),
    true,
  );
  assert.equal(
    hasResumeAccess({ status: "active", plan_name: "pro" }, now),
    true,
  );
  assert.equal(
    hasResumeAccess(
      { status: "active", amount: 1499, current_period_end: now / 1000 + 60 },
      now,
    ),
    true,
  );
  for (const subscription of [
    { status: "active", amount: 0 },
    { status: "active", plan_name: "basic" },
    { status: "canceled", amount: 2899 },
    { status: "active", amount: 2899, current_period_end: now / 1000 - 1 },
    {},
  ]) {
    assert.equal(hasResumeAccess(subscription, now), false);
  }
});
