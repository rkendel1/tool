-- Realtime schema initialization
-- This creates the necessary schema and tables for Supabase Realtime

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant permissions
GRANT USAGE ON SCHEMA _realtime TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- Create realtime configuration table
CREATE TABLE IF NOT EXISTS _realtime.schema_migrations (
    version bigint PRIMARY KEY,
    inserted_at timestamp(0) NOT NULL DEFAULT NOW()
);

-- Create publication for realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Enable realtime for public schema by default
-- Tables can opt-in to realtime by being added to this publication
-- Example: ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
