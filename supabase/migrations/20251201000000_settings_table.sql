-- Create settings table for storing app configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification email
INSERT INTO settings (key, value)
VALUES ('notification_email', 'info@northproservices.de')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all to read settings
CREATE POLICY "Allow read for all" ON settings
FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow all for service role" ON settings
FOR ALL USING (true);
