import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

interface EmailRequest {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: {
    filename: string;
    mimeType: string;
    base64: string;
  }[];
  inline?: {
    cid: string;
    filename: string;
    mimeType: string;
    base64: string;
  }[];
}

function buildMimeMessage(emailData: EmailRequest, fromEmail: string): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const toAddresses = Array.isArray(emailData.to)
    ? emailData.to.join(", ")
    : emailData.to;

  let mimeMessage = `From: ${fromEmail}\r\n`;
  mimeMessage += `To: ${toAddresses}\r\n`;

  if (emailData.cc && emailData.cc.length > 0) {
    mimeMessage += `Cc: ${emailData.cc.join(", ")}\r\n`;
  }

  if (emailData.bcc && emailData.bcc.length > 0) {
    mimeMessage += `Bcc: ${emailData.bcc.join(", ")}\r\n`;
  }

  mimeMessage += `Subject: ${emailData.subject}\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;

  const hasAttachments =
    emailData.attachments && emailData.attachments.length > 0;
  const hasInline = emailData.inline && emailData.inline.length > 0;
  const hasHtml = emailData.bodyHtml;
  const hasText = emailData.bodyText;

  if (hasAttachments || hasInline) {
    mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // Body content
    if (hasHtml && hasText) {
      const altBoundary = `alt_${boundary}`;
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

      mimeMessage += `--${altBoundary}\r\n`;
      mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      mimeMessage += `${emailData.bodyText}\r\n\r\n`;

      mimeMessage += `--${altBoundary}\r\n`;
      mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
      mimeMessage += `${emailData.bodyHtml}\r\n\r\n`;

      mimeMessage += `--${altBoundary}--\r\n`;
    } else if (hasHtml) {
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
      mimeMessage += `${emailData.bodyHtml}\r\n\r\n`;
    } else if (hasText) {
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      mimeMessage += `${emailData.bodyText}\r\n\r\n`;
    }

    // Inline attachments
    if (hasInline) {
      emailData.inline!.forEach((inline) => {
        mimeMessage += `--${boundary}\r\n`;
        mimeMessage += `Content-Type: ${inline.mimeType}\r\n`;
        mimeMessage += `Content-Disposition: inline; filename="${inline.filename}"\r\n`;
        mimeMessage += `Content-ID: <${inline.cid}>\r\n`;
        mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
        mimeMessage += `${inline.base64}\r\n\r\n`;
      });
    }

    // Regular attachments
    if (hasAttachments) {
      emailData.attachments!.forEach((attachment) => {
        mimeMessage += `--${boundary}\r\n`;
        mimeMessage += `Content-Type: ${attachment.mimeType}\r\n`;
        mimeMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
        mimeMessage += `${attachment.base64}\r\n\r\n`;
      });
    }

    mimeMessage += `--${boundary}--\r\n`;
  } else if (hasHtml && hasText) {
    mimeMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
    mimeMessage += `${emailData.bodyText}\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    mimeMessage += `${emailData.bodyHtml}\r\n\r\n`;

    mimeMessage += `--${boundary}--\r\n`;
  } else if (hasHtml) {
    mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    mimeMessage += `${emailData.bodyHtml}\r\n`;
  } else {
    mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
    mimeMessage += `${emailData.bodyText || ""}\r\n`;
  }

  return mimeMessage;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailData: EmailRequest = await request.json();

    // Validate required fields
    if (!emailData.to || !emailData.subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 },
      );
    }

    // Get user's Google account
    const { data: googleAccount, error: accountError } = await supabase
      .from("user_google_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (accountError || !googleAccount) {
      return NextResponse.json(
        {
          error:
            "No Gmail account connected. Please connect your Gmail account first.",
        },
        { status: 400 },
      );
    }

    if (googleAccount.needs_reauth) {
      return NextResponse.json(
        {
          error:
            "Gmail account needs re-authentication. Please reconnect your account.",
        },
        { status: 401 },
      );
    }

    let accessToken = googleAccount.access_token;

    // Check if token needs refresh
    if (!accessToken || new Date() >= new Date(googleAccount.token_expiry)) {
      const refreshResult = await refreshAccessToken(
        googleAccount.refresh_token,
      );

      if (!refreshResult) {
        // Mark account as needing reauth
        await supabase
          .from("user_google_accounts")
          .update({ needs_reauth: true })
          .eq("id", googleAccount.id);

        return NextResponse.json(
          {
            error:
              "Gmail authentication expired. Please reconnect your account.",
          },
          { status: 401 },
        );
      }

      accessToken = refreshResult.access_token;

      // Update stored token
      await supabase
        .from("user_google_accounts")
        .update({
          access_token: accessToken,
          token_expiry: new Date(
            Date.now() + refreshResult.expires_in * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", googleAccount.id);
    }

    // Build MIME message
    const mimeMessage = buildMimeMessage(emailData, googleAccount.google_email);
    const encodedMessage = base64UrlEncode(mimeMessage);

    // Send email via Gmail API
    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      },
    );

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json().catch(() => ({}));

      let errorMessage = "Failed to send email";
      let errorCode = "SEND_FAILED";

      if (sendResponse.status === 401) {
        errorMessage =
          "Gmail authentication expired. Please reconnect your account.";
        errorCode = "AUTH_EXPIRED";

        // Mark account as needing reauth
        await supabase
          .from("user_google_accounts")
          .update({ needs_reauth: true })
          .eq("id", googleAccount.id);
      } else if (sendResponse.status === 403) {
        errorMessage =
          "Daily sending limit reached. Please try again tomorrow.";
        errorCode = "QUOTA_EXCEEDED";
      } else if (sendResponse.status === 400) {
        errorMessage = "Invalid email format or recipient address.";
        errorCode = "INVALID_EMAIL";
      } else if (sendResponse.status === 413) {
        errorMessage = "Email or attachments too large.";
        errorCode = "TOO_LARGE";
      }

      // Store failed email record
      await supabase.from("outbound_emails").insert({
        user_id: user.id,
        google_email: googleAccount.google_email,
        to_addresses: Array.isArray(emailData.to)
          ? emailData.to
          : [emailData.to],
        cc_addresses: emailData.cc || [],
        bcc_addresses: emailData.bcc || [],
        subject: emailData.subject,
        body_html: emailData.bodyHtml,
        body_text: emailData.bodyText,
        attachments_json: emailData.attachments || [],
        status: "failed",
        error_code: errorCode,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: sendResponse.status },
      );
    }

    const sendResult = await sendResponse.json();

    // Store successful email record
    const { data: emailRecord } = await supabase
      .from("outbound_emails")
      .insert({
        user_id: user.id,
        google_email: googleAccount.google_email,
        to_addresses: Array.isArray(emailData.to)
          ? emailData.to
          : [emailData.to],
        cc_addresses: emailData.cc || [],
        bcc_addresses: emailData.bcc || [],
        subject: emailData.subject,
        body_html: emailData.bodyHtml,
        body_text: emailData.bodyText,
        attachments_json: emailData.attachments || [],
        gmail_message_id: sendResult.id,
        gmail_thread_id: sendResult.threadId,
        status: "sent",
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({
      status: "sent",
      messageId: sendResult.id,
      threadId: sendResult.threadId,
      emailRecordId: emailRecord?.id,
      gmailUrl: `https://mail.google.com/mail/u/${googleAccount.google_email}/#inbox/${sendResult.threadId}`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
