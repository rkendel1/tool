-- Storage Schema for Supabase Storage
-- This creates the necessary schema and tables for Supabase Storage service

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Grant permissions on storage schema
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- Make storage schema owned by supabase_storage_admin if the role exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    ALTER SCHEMA storage OWNER TO supabase_storage_admin;
  END IF;
END
$$;

-- Buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    owner uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Objects table
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    last_accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    CONSTRAINT objects_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id),
    CONSTRAINT objects_name_unique UNIQUE (bucket_id, name)
);

-- Indexes for objects table
CREATE INDEX IF NOT EXISTS bucketid_objname ON storage.objects USING btree (bucket_id, name);
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name);
CREATE INDEX IF NOT EXISTS name_prefix_search ON storage.objects USING btree (name text_pattern_ops);

-- Migrations table for storage schema
CREATE TABLE IF NOT EXISTS storage.migrations (
    id integer NOT NULL PRIMARY KEY,
    name character varying(100) NOT NULL UNIQUE,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- S3 Multipart Uploads tables
CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads (
    id text NOT NULL PRIMARY KEY,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Indexes for s3_multipart_uploads
CREATE UNIQUE INDEX IF NOT EXISTS idx_multipart_uploads_bucket_id_key_version ON storage.s3_multipart_uploads USING btree (bucket_id, key, version);

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id),
    CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE
);

-- Indexes for s3_multipart_uploads_parts
CREATE UNIQUE INDEX IF NOT EXISTS idx_multipart_uploads_parts_upload_id_part_number ON storage.s3_multipart_uploads_parts USING btree (upload_id, part_number);

-- Helper functions

-- Function to search for objects
CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata
    FROM storage.objects o
    WHERE o.bucket_id = bucketname
        AND (prefix = '' OR o.name ILIKE prefix || '%')
        AND (search = '' OR o.name ILIKE '%' || search || '%')
    ORDER BY
        CASE WHEN sortcolumn = 'name' AND sortorder = 'asc' THEN o.name END ASC,
        CASE WHEN sortcolumn = 'name' AND sortorder = 'desc' THEN o.name END DESC,
        CASE WHEN sortcolumn = 'updated_at' AND sortorder = 'asc' THEN o.updated_at END ASC,
        CASE WHEN sortcolumn = 'updated_at' AND sortorder = 'desc' THEN o.updated_at END DESC,
        CASE WHEN sortcolumn = 'created_at' AND sortorder = 'asc' THEN o.created_at END ASC,
        CASE WHEN sortcolumn = 'created_at' AND sortorder = 'desc' THEN o.created_at END DESC,
        CASE WHEN sortcolumn = 'last_accessed_at' AND sortorder = 'asc' THEN o.last_accessed_at END ASC,
        CASE WHEN sortcolumn = 'last_accessed_at' AND sortorder = 'desc' THEN o.last_accessed_at END DESC
    LIMIT limits
    OFFSET offsets;
END;
$$;

-- Function to get the size of a bucket
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
RETURNS TABLE(size bigint, bucket_id text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT sum((metadata->>'size')::int)::bigint AS size, obj.bucket_id
    FROM storage.objects AS obj
    GROUP BY obj.bucket_id;
END;
$$;

-- Extension for handling file uploads
CREATE OR REPLACE FUNCTION storage.extension(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    _parts text[];
    _ext text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT split_part(_parts[array_length(_parts, 1)], '.', 2) INTO _ext;
    RETURN _ext;
END;
$$;

-- Function to get filename from path
CREATE OR REPLACE FUNCTION storage.filename(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END;
$$;

-- Function to get folder name from path
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[1:array_length(_parts, 1)-1];
END;
$$;

-- RLS (Row Level Security) Policies

-- Enable RLS on buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public buckets
CREATE POLICY "Public buckets are viewable by everyone" ON storage.buckets
    FOR SELECT USING (public = true);

-- Policy: Anyone can view objects in public buckets
CREATE POLICY "Public objects are viewable by everyone" ON storage.objects
    FOR SELECT USING (
        bucket_id IN (
            SELECT id FROM storage.buckets WHERE public = true
        )
    );

-- Policy: Authenticated users can upload to public buckets
CREATE POLICY "Authenticated users can upload to public buckets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN (
            SELECT id FROM storage.buckets WHERE public = true
        )
        AND (auth.role() = 'authenticated')
    );

-- Policy: Users can update their own objects
CREATE POLICY "Users can update their own objects" ON storage.objects
    FOR UPDATE USING (auth.uid() = owner);

-- Policy: Users can delete their own objects
CREATE POLICY "Users can delete their own objects" ON storage.objects
    FOR DELETE USING (auth.uid() = owner);

-- Grant appropriate permissions to supabase_storage_admin
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO supabase_storage_admin;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA storage TO supabase_storage_admin;
  END IF;
END
$$;

-- Grant usage to service_role (for backend operations)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO service_role;
