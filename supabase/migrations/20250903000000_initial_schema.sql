-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('scanner', 'admin')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create checkpoints table
CREATE TABLE IF NOT EXISTS public.checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "order" INTEGER UNIQUE NOT NULL CHECK ("order" >= 1 AND "order" <= 20),
    qrcode TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    complete BOOLEAN DEFAULT FALSE,
    has_notes BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    checkpoint_id UUID REFERENCES public.checkpoints(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('ok', 'not_ok')) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_scans_session_id ON public.scans(session_id);
CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_checkpoint_id ON public.scans(checkpoint_id);

-- Insert default checkpoints (1-20)
INSERT INTO public.checkpoints (name, "order", qrcode) VALUES
    ('Checkpoint 1', 1, 'np-cp-01'),
    ('Checkpoint 2', 2, 'np-cp-02'),
    ('Checkpoint 3', 3, 'np-cp-03'),
    ('Checkpoint 4', 4, 'np-cp-04'),
    ('Checkpoint 5', 5, 'np-cp-05'),
    ('Checkpoint 6', 6, 'np-cp-06'),
    ('Checkpoint 7', 7, 'np-cp-07'),
    ('Checkpoint 8', 8, 'np-cp-08'),
    ('Checkpoint 9', 9, 'np-cp-09'),
    ('Checkpoint 10', 10, 'np-cp-10'),
    ('Checkpoint 11', 11, 'np-cp-11'),
    ('Checkpoint 12', 12, 'np-cp-12'),
    ('Checkpoint 13', 13, 'np-cp-13'),
    ('Checkpoint 14', 14, 'np-cp-14'),
    ('Checkpoint 15', 15, 'np-cp-15'),
    ('Checkpoint 16', 16, 'np-cp-16'),
    ('Checkpoint 17', 17, 'np-cp-17'),
    ('Checkpoint 18', 18, 'np-cp-18'),
    ('Checkpoint 19', 19, 'np-cp-19'),
    ('Checkpoint 20', 20, 'np-cp-20')
ON CONFLICT DO NOTHING;