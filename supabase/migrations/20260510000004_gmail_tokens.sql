ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gmail_email TEXT CHECK (
    gmail_email IS NULL OR char_length(gmail_email) <= 254
  ),
  ADD COLUMN IF NOT EXISTS gmail_access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS gmail_refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS gmail_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_scopes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_gmail_connected_idx
  ON profiles (gmail_connected_at)
  WHERE gmail_connected_at IS NOT NULL;
