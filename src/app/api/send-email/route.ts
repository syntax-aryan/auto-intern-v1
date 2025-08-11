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

    const { email, recipientEmail, subject, targetCompany } =
      await request.json();

    // Check user's subscription and email limit
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 403 },
      );
    }

    // Get current email count for this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: emailCount } = await supabase
      .from("sent_emails")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", `${currentMonth}-01`)
      .lt("created_at", `${currentMonth}-32`);

    const emailsSentThisMonth = emailCount?.length || 0;
    const emailLimit =
      subscription.plan_name === "basic"
        ? 5
        : subscription.plan_name === "premium"
          ? 50
          : 200;

    if (emailsSentThisMonth >= emailLimit) {
      return NextResponse.json(
        { error: "Email limit reached for this month" },
        { status: 403 },
      );
    }

    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll simulate sending and store the email record

    // Store the sent email record
    const { error: insertError } = await supabase.from("sent_emails").insert({
      user_id: user.id,
      recipient_email: recipientEmail,
      subject: subject,
      content: email,
      target_company: targetCompany,
      status: "sent",
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to record sent email" },
        { status: 500 },
      );
    }

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      emailsRemaining: emailLimit - emailsSentThisMonth - 1,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
