import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=oauth_denied`,
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=invalid_callback`,
      );
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      userId = stateData.userId;
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=invalid_state`,
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=unauthorized`,
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=oauth_config`,
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=token_exchange`,
      );
    }

    const tokens = await tokenResponse.json();

    // Get user's email from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=user_info`,
      );
    }

    const userInfo = await userInfoResponse.json();

    // Store or update the Google account
    const { error: upsertError } = await supabase
      .from("user_google_accounts")
      .upsert(
        {
          user_id: user.id,
          google_email: userInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(
            Date.now() + tokens.expires_in * 1000,
          ).toISOString(),
          scopes: [
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
          ],
          needs_reauth: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,google_email",
        },
      );

    if (upsertError) {
      console.error("Error storing Google account:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=storage`,
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?success=gmail_connected`,
    );
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?error=callback_error`,
    );
  }
}
