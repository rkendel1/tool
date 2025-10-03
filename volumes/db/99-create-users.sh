#!/bin/bash
set -e

# Create Supabase-specific database users with passwords from environment variables
# These users are required for Supabase services (Auth, Storage, etc.)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create authenticator role for PostgREST
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator LOGIN PASSWORD '$POSTGRES_PASSWORD' NOINHERIT;
      END IF;
    END
    \$\$;

    -- Grant roles to authenticator
    GRANT anon TO authenticator;
    GRANT authenticated TO authenticator;
    GRANT service_role TO authenticator;

    -- Create supabase_admin role
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin LOGIN SUPERUSER PASSWORD '$POSTGRES_PASSWORD';
      END IF;
    END
    \$\$;

    -- Create supabase_auth_admin role
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin LOGIN PASSWORD '$POSTGRES_PASSWORD';
      END IF;
    END
    \$\$;

    -- Create supabase_storage_admin role
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE ROLE supabase_storage_admin LOGIN PASSWORD '$POSTGRES_PASSWORD';
      END IF;
    END
    \$\$;

    -- Grant schema permissions
    GRANT USAGE ON SCHEMA public TO supabase_admin;
    GRANT ALL ON SCHEMA public TO supabase_admin;
EOSQL
