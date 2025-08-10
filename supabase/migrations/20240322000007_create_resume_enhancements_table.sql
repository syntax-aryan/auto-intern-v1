CREATE TABLE IF NOT EXISTS resume_enhancements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_resume TEXT NOT NULL,
  enhanced_resume TEXT NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_enhancements_user_id ON resume_enhancements(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_enhancements_created_at ON resume_enhancements(created_at);

alter publication supabase_realtime add table resume_enhancements;