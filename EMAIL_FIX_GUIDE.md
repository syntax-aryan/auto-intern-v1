# Email Confirmation Fix Guide

## Problem
Users are not receiving email confirmation links after signing up, even though the sign-up process works.

## Root Cause
The issue is likely related to Supabase SMTP configuration with Brevo. Here are the most common causes:

1. **Missing or incorrect SMTP configuration in Supabase**
2. **Brevo API key or SMTP credentials not properly set**
3. **Email templates not configured**
4. **Domain verification issues**

## Solution Steps

### Step 1: Configure Brevo SMTP in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Email Templates**

2. **Set up Custom SMTP Provider**
   - Click on **"Enable custom SMTP provider"**
   - Select **"Brevo"** from the dropdown
   - Enter your Brevo SMTP credentials:

```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP User: Your Brevo API Key
SMTP Password: Your Brevo API Key
```

3. **Get your Brevo API Key**
   - Log into your Brevo account
   - Go to **SMTP & API** → **API Keys**
   - Create a new API key or copy existing one
   - Use this API key as both username and password

### Step 2: Configure Email Templates

1. **In Supabase Dashboard, go to Authentication → Email Templates**

2. **Update the "Confirm signup" template:**
   ```html
   <h2>Confirm your signup</h2>
   
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
   
   <p>Or copy and paste this URL into your browser:</p>
   <p>{{ .ConfirmationURL }}</p>
   ```

3. **Update the "Reset password" template:**
   ```html
   <h2>Reset your password</h2>
   
   <p>Follow this link to reset your password:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
   
   <p>Or copy and paste this URL into your browser:</p>
   <p>{{ .ConfirmationURL }}</p>
   ```

### Step 3: Verify Domain Settings

1. **In Brevo Dashboard:**
   - Go to **Senders & IP** → **Senders**
   - Add your domain as a sender
   - Verify your domain (follow Brevo's verification process)

2. **Update sender email in Supabase:**
   - In Supabase Dashboard → Authentication → Settings
   - Set **"Sender email"** to your verified domain email
   - Example: `noreply@yourdomain.com`

### Step 4: Test Email Configuration

1. **Send a test email from Supabase Dashboard:**
   - Go to Authentication → Email Templates
   - Click "Send test email"
   - Enter your email address
   - Check if you receive the test email

2. **Check Supabase logs:**
   - Go to Logs → Auth
   - Look for any email-related errors

### Step 5: Environment Variables (Optional)

If you want to configure SMTP via environment variables, add these to your Supabase project:

```bash
# In Supabase Dashboard → Settings → Environment Variables
SMTP_ADMIN_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_api_key
SMTP_PASS=your_brevo_api_key
SMTP_SENDER_NAME=Your App Name
```

### Step 6: Alternative - Use Supabase's Built-in Email Service

If Brevo continues to have issues, you can temporarily use Supabase's built-in email service:

1. **In Supabase Dashboard → Authentication → Settings**
2. **Disable "Custom SMTP provider"**
3. **This will use Supabase's default email service**

## Troubleshooting

### Check Email Delivery
1. **Check spam/junk folder**
2. **Verify email address is correct**
3. **Check Brevo sending logs**

### Common Issues
1. **"Rate limit exceeded"** - Upgrade Brevo plan or use Supabase's service
2. **"Authentication failed"** - Check API key is correct
3. **"Domain not verified"** - Complete domain verification in Brevo

### Debug Steps
1. **Check Supabase logs for email errors**
2. **Verify Brevo API key is active**
3. **Test SMTP connection manually**
4. **Check if emails are being sent from Brevo dashboard**

## Quick Fix Commands

If you need to reset email configuration:

```sql
-- Check if email templates exist
SELECT * FROM auth.email_templates;

-- Reset to default templates (if needed)
-- This is done through Supabase Dashboard, not SQL
```

## Expected Result
After following these steps, users should receive confirmation emails immediately after signing up.

## Next Steps
1. Test the sign-up process with a new email
2. Check email delivery in both inbox and spam
3. Verify the confirmation link works
4. Monitor Supabase logs for any remaining issues 