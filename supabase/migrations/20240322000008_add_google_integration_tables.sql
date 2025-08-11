CREATE TABLE IF NOT EXISTS user_google_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  provider TEXT DEFAULT 'google' NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] DEFAULT ARRAY['https://www.googleapis.com/auth/gmail.send'],
  needs_reauth BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, google_email)
);

CREATE TABLE IF NOT EXISTS outbound_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  attachments_json JSONB,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_google_accounts_user_id ON user_google_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_user_id ON outbound_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_status ON outbound_emails(status);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_created_at ON outbound_emails(created_at);

alter publication supabase_realtime add table user_google_accounts;
alter publication supabase_realtime add table outbound_emails;