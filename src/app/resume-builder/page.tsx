"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Upload } from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_JOB_LENGTH,
  MAX_RESUME_LENGTH,
  MAX_PREFERENCE_LENGTH,
  parseResumeInput,
} from "@/lib/resume-input";
import type { ResumeAnswer } from "@/lib/resume-input";

interface Question {
  id: string;
  question: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options?: string[];
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: "target-role",
    question: "What role(s) are you targeting?",
    type: "text",
    placeholder: "e.g., Software Engineer, Product Manager, Data Scientist",
  },
  {
    id: "technical-skills",
    question: "What are your top 3 technical skills?",
    type: "text",
    placeholder: "e.g., Python, React, Machine Learning",
  },
  {
    id: "achievements",
    question: "What are your biggest achievements in your last role?",
    type: "textarea",
    placeholder: "Describe your key accomplishments and their impact...",
  },
  {
    id: "metrics",
    question: "Do you have measurable metrics to showcase impact?",
    type: "textarea",
    placeholder:
      "e.g., Increased sales by 25%, Reduced processing time by 40%...",
  },
  {
    id: "industries",
    question: "Which industries are you applying to?",
    type: "select",
    options: [
      "Technology",
      "Finance",
      "Healthcare",
      "Consulting",
      "Marketing",
      "Education",
      "Manufacturing",
      "Other",
    ],
  },
  {
    id: "resume-style",
    question:
      "Do you want a creative style or a corporate ATS-optimized style?",
    type: "select",
    options: [
      "ATS-Optimized (Recommended)",
      "Creative Style",
      "Balanced Approach",
    ],
  },
  {
    id: "experience-level",
    question: "What's your experience level?",
    type: "select",
    options: [
      "Entry Level (0-2 years)",
      "Mid Level (3-5 years)",
      "Senior Level (6+ years)",
    ],
  },
  {
    id: "career-focus",
    question: "What's your primary career focus?",
    type: "select",
    options: [
      "Leadership & Management",
      "Technical Expertise",
      "Innovation & Strategy",
      "Client Relations",
      "Operations & Efficiency",
    ],
  },
];

export default function ResumeBuilder() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [draft, setDraft] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileVersion = useRef(0);
  const inFlight = useRef(false);

  const loadFile = async (file?: File) => {
    if (!file) return;
    const version = ++fileVersion.current;
    setError("");
    setErrorStatus(0);
    if (!file.name.toLowerCase().endsWith(".txt") || file.size > 100_000) {
      setError(
        "Upload a TXT file under 100 KB, or paste text from your PDF or Word resume.",
      );
      setIsReading(false);
      return;
    }
    setIsReading(true);
    try {
      const text = await file.text();
      const input = parseResumeInput({ resumeText: text });
      if (version !== fileVersion.current) return;
      setResumeText(input.resumeText);
      setFileName(file.name);
    } catch (cause) {
      if (version === fileVersion.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "The file could not be read.",
        );
    } finally {
      if (version === fileVersion.current) setIsReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const generate = async (answers: ResumeAnswer[] = []) => {
    if (inFlight.current || isReading) return;
    setError("");
    setErrorStatus(0);
    let input;
    try {
      input = parseResumeInput({ resumeText, jobDescription, answers });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check your resume text.",
      );
      return;
    }
    inFlight.current = true;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume-enhancements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrorStatus(response.status);
        throw new Error(
          result.error || "The draft could not be created. Please try again.",
        );
      }
      if (
        typeof result.enhancedResume !== "string" ||
        !result.enhancedResume.trim()
      ) {
        throw new Error("No draft was returned. Please try again.");
      }
      setDraft(result.enhancedResume);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The draft could not be created. Please try again.",
      );
    } finally {
      inFlight.current = false;
      setIsGenerating(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([draft], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume-draft.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardNavbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Resume Builder</h1>
          <p className="text-gray-400">
            See a first draft, then customize it. Requires an active Premium or
            Pro subscription.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800 bg-red-950/30 p-4"
          >
            <p>{error}</p>
            {errorStatus === 401 && (
              <Link className="mt-2 inline-block underline" href="/sign-in">
                Sign in
              </Link>
            )}
            {errorStatus === 403 && (
              <Link className="mt-2 inline-block underline" href="/pricing">
                View plans
              </Link>
            )}
          </div>
        )}

        {!draft ? (
          <Card className="border-gray-800 bg-gray-900 text-white">
            <CardHeader>
              <CardTitle>Create your first draft</CardTitle>
              <CardDescription className="text-gray-400">
                Paste your resume or upload a TXT file. For PDF or DOCX, copy
                the text into the field below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void generate();
                }}
              >
                <fieldset disabled={isGenerating} className="space-y-5">
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInput.current?.click()}
                      disabled={isReading}
                      className="border-gray-600 bg-gray-800 text-white"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isReading ? "Reading file..." : "Upload TXT"}
                    </Button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".txt,text/plain"
                      aria-label="Upload a TXT resume"
                      className="hidden"
                      onChange={(event) =>
                        void loadFile(event.target.files?.[0])
                      }
                    />
                    {fileName && (
                      <p className="mt-2 text-sm text-gray-400">{fileName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resume-text">Resume text</Label>
                    <Textarea
                      id="resume-text"
                      value={resumeText}
                      maxLength={MAX_RESUME_LENGTH}
                      required
                      rows={12}
                      className="border-gray-700 bg-gray-800 text-white"
                      onChange={(event) => {
                        fileVersion.current++;
                        setIsReading(false);
                        setResumeText(event.target.value);
                        setFileName("");
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-description">
                      Job description (optional)
                    </Label>
                    <Textarea
                      id="job-description"
                      value={jobDescription}
                      maxLength={MAX_JOB_LENGTH}
                      rows={5}
                      className="border-gray-700 bg-gray-800 text-white"
                      onChange={(event) =>
                        setJobDescription(event.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!resumeText.trim() || isGenerating || isReading}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {isGenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    {isGenerating ? "Creating draft..." : "Create first draft"}
                  </Button>
                  <p className="text-sm text-gray-400">
                    Your resume and any job description are sent to OpenAI to
                    create the draft.
                  </p>
                </fieldset>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-gray-800 bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Your resume draft</CardTitle>
                <CardDescription className="text-gray-400">
                  Review the details before using it. Download this version now,
                  or add optional preferences below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre
                  tabIndex={0}
                  className="max-h-[36rem] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-950 p-5 text-sm leading-6"
                >
                  {draft}
                </pre>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={download}
                    disabled={isGenerating}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download TXT
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => {
                      setDraft("");
                      setPreferences({});
                      setError("");
                      setErrorStatus(0);
                    }}
                    className="border-gray-600 bg-gray-800 text-white"
                  >
                    Edit source resume
                  </Button>
                </div>
                <details className="text-sm text-gray-400">
                  <summary className="cursor-pointer">
                    Compare with your original resume
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap">{resumeText}</pre>
                </details>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Customize your draft (optional)</CardTitle>
                <CardDescription className="text-gray-400">
                  Skip any field. Add only experience and details that are true
                  for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void generate(
                      Object.entries(preferences)
                        .filter(([, value]) => value.trim())
                        .map(([questionId, answer]) => ({
                          questionId,
                          answer,
                        })),
                    );
                  }}
                >
                  <fieldset disabled={isGenerating} className="space-y-5">
                    {questions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <Label htmlFor={question.id}>{question.question}</Label>
                        {question.type === "select" ? (
                          <select
                            id={question.id}
                            className="w-full rounded-md border border-gray-700 bg-gray-800 p-2 text-sm text-white"
                            value={preferences[question.id] || ""}
                            onChange={(event) =>
                              setPreferences((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">No preference</option>
                            {question.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : question.type === "textarea" ? (
                          <Textarea
                            id={question.id}
                            maxLength={MAX_PREFERENCE_LENGTH}
                            placeholder={question.placeholder}
                            className="border-gray-700 bg-gray-800 text-white"
                            value={preferences[question.id] || ""}
                            onChange={(event) =>
                              setPreferences((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          <Input
                            id={question.id}
                            maxLength={MAX_PREFERENCE_LENGTH}
                            placeholder={question.placeholder}
                            className="border-gray-700 bg-gray-800 text-white"
                            value={preferences[question.id] || ""}
                            onChange={(event) =>
                              setPreferences((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="submit"
                      disabled={
                        isGenerating ||
                        !Object.values(preferences).some((value) =>
                          value.trim(),
                        )
                      }
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      {isGenerating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isGenerating ? "Updating draft..." : "Update draft"}
                    </Button>
                    <p role="status" className="text-sm text-gray-400">
                      {isGenerating
                        ? "Your current draft stays available while the new version is generated."
                        : "Customization is optional. Your first draft is already available above."}
                    </p>
                  </fieldset>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
