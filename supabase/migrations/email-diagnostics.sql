-- Email Diagnostics Script
-- Run this in Supabase SQL Editor to check email-related configurations

-- Check if email templates exist
SELECT 
    template_type,
    subject,
    created_at,
    updated_at
FROM auth.email_templates;

-- Check recent auth events for email-related issues
SELECT 
    event_type,
    created_at,
    ip_address,
    user_agent
FROM auth.audit_log_entries 
WHERE event_type IN ('signup', 'email_confirmed', 'email_change_requested')
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any users waiting for email confirmation
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check for any failed email attempts (if available)
-- Note: This might not be available in all Supabase instances
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_change_confirm_status
FROM auth.users 
WHERE email_confirmed_at IS NULL 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC; 