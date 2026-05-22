CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS mc_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  profile_photo text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mc_user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES mc_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mc_endpoint_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES mc_users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('backend', 'mqtt')),
  template_id text NOT NULL DEFAULT 'station2',
  base_url text DEFAULT '',
  broker_url text DEFAULT '',
  endpoint_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  topic_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  use_single_endpoint boolean NOT NULL DEFAULT false,
  client_resample text NOT NULL DEFAULT 'none',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS mc_endpoint_configs_one_active_per_user
  ON mc_endpoint_configs (user_id)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS mc_dashboard_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES mc_users(id) ON DELETE CASCADE,
  config_id uuid NOT NULL REFERENCES mc_endpoint_configs(id) ON DELETE RESTRICT,
  client_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  template_id text NOT NULL DEFAULT 'station2',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_id),
  UNIQUE (user_id, template_id, slug)
);

CREATE INDEX IF NOT EXISTS mc_user_sessions_token_hash_idx
  ON mc_user_sessions (token_hash);

CREATE INDEX IF NOT EXISTS mc_dashboard_links_public_lookup_idx
  ON mc_dashboard_links (template_id, slug);

CREATE INDEX IF NOT EXISTS mc_endpoint_configs_user_idx
  ON mc_endpoint_configs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS mc_dashboard_links_user_idx
  ON mc_dashboard_links (user_id, updated_at DESC);
