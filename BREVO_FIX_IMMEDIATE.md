# Immediate Fix for Brevo Sender Compliance Issue

## Problem
Getting error: "Sending has been rejected because the sender you used is not valid"
Gmail sender is showing "Freemail domain is not recommended" due to new Google/Yahoo/Microsoft requirements.

## Quick Fix (5 minutes)

### Step 1: Disable Custom SMTP in Supabase
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. **Uncheck "Enable custom SMTP provider"**
3. **Save changes**

### Step 2: Test Signup
1. Go to your Vercel app
2. Try signing up with a test email
3. Check if you receive the confirmation email

## Why This Works
- Supabase's built-in email service handles all compliance automatically
- No domain verification needed
- Works immediately
- Good for development and testing

## Long-term Solution
1. **Get a custom domain** (e.g., autointern.com)
2. **Set up proper DNS records** (DKIM, SPF, DMARC)
3. **Add domain sender in Brevo**
4. **Re-enable custom SMTP** once domain is verified

## Alternative Quick Fix
If you want to keep using Brevo:
1. **Delete Gmail sender** in Brevo
2. **Add sender**: `noreply@autointern-app.com` (or any available domain)
3. **Use a domain you own** or can verify

This should resolve the immediate issue and get your signup emails working! 