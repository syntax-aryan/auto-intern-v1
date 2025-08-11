import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: emailRecord, error } = await supabase
      .from("outbound_emails")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !emailRecord) {
      return NextResponse.json(
        { error: "Email record not found" },
        { status: 404 },
      );
    }

    // Return email metadata (excluding sensitive content)
    return NextResponse.json({
      id: emailRecord.id,
      to: emailRecord.to_addresses,
      cc: emailRecord.cc_addresses,
      bcc: emailRecord.bcc_addresses,
      subject: emailRecord.subject,
      status: emailRecord.status,
      gmailMessageId: emailRecord.gmail_message_id,
      gmailThreadId: emailRecord.gmail_thread_id,
      errorCode: emailRecord.error_code,
      errorMessage: emailRecord.error_message,
      createdAt: emailRecord.created_at,
      sentAt: emailRecord.sent_at,
      gmailUrl: emailRecord.gmail_message_id
        ? `https://mail.google.com/mail/u/${emailRecord.google_email}/#inbox/${emailRecord.gmail_thread_id}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching email record:", error);
    return NextResponse.json(
      { error: "Failed to fetch email record" },
      { status: 500 },
    );
  }
}
