import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if user has completed onboarding
      const { data: userData, error } = await supabase
        .from("users")
        .select("onboarding_data")
        .eq("id", user.id)
        .single();

      if (error || !userData?.onboarding_data) {
        // User has not completed onboarding, redirect to onboarding page
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
} 