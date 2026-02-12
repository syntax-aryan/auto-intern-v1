import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data with onboarding information
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get subscription data
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // Get email count for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: emailCount } = await supabase
      .from("sent_emails")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", `${currentMonth}-01`)
      .lt("created_at", `${currentMonth}-32`);

    const emailsSentThisMonth = emailCount?.length || 0;
    const emailLimit =
      subscription?.plan_name === "basic"
        ? 5
        : subscription?.plan_name === "premium"
          ? 50
          : 200;

    return NextResponse.json({
      user: userData,
      subscription,
      emailsUsed: emailsSentThisMonth,
      emailLimit,
      emailsRemaining: emailLimit - emailsSentThisMonth,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}