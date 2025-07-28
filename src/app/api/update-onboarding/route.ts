import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const onboardingData = await request.json();

    // Update user's onboarding data in the database
    const { error } = await supabase
      .from("users")
      .update({
        onboarding_data: onboardingData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update onboarding data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding data" },
      { status: 500 },
    );
  }
}