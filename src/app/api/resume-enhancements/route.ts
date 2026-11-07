import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import {
  hasResumeAccess,
  parseResumeInput,
  ResumeError,
} from "@/lib/resume-input";
import { generateResumeDraft } from "@/lib/resume-generation";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ResumeError("Send a valid JSON request.");
    }
    // Empty optional answers are valid: the first draft comes before preferences.
    const input = parseResumeInput(body);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Sign in to create a resume draft." },
        { status: 401 },
      );
    }
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);
    if (subscriptionError) {
      throw new ResumeError(
        "Your subscription could not be checked. Please try again.",
        503,
      );
    }
    if (!subscriptions?.some((subscription) => hasResumeAccess(subscription))) {
      return NextResponse.json(
        {
          error:
            "A Premium or Pro subscription is required for Resume Builder.",
        },
        { status: 403 },
      );
    }
    const enhancedResume = await generateResumeDraft(input, {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_RESUME_MODEL,
    });
    // Do not persist candidate resume content in a table without confirmed RLS.
    return NextResponse.json(
      { enhancedResume },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ResumeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Resume generation failed");
    return NextResponse.json(
      { error: "Resume generation could not finish. Please try again." },
      { status: 500 },
    );
  }
}
