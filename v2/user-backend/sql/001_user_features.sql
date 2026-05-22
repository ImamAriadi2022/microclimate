CREATE DATABASE IF NOT EXISTS microclimate_user
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE microclimate_user;

CREATE TABLE IF NOT EXISTS mc_users (
  id CHAR(36) NOT NULL,
  email VARCHAR(191) NOT NULL,
  username VARCHAR(191) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY mc_users_email_unique (email),
  UNIQUE KEY mc_users_username_unique (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mc_user_sessions (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY mc_user_sessions_token_hash_unique (token_hash),
  KEY mc_user_sessions_user_id_idx (user_id),
  CONSTRAINT mc_user_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES mc_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mc_endpoint_configs (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  client_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  source_type ENUM('backend', 'mqtt') NOT NULL,
  template_id VARCHAR(100) NOT NULL DEFAULT 'station2',
  base_url TEXT NULL,
  broker_url TEXT NULL,
  endpoint_map JSON NOT NULL,
  topic_map JSON NOT NULL,
  use_single_endpoint TINYINT(1) NOT NULL DEFAULT 0,
  client_resample VARCHAR(32) NOT NULL DEFAULT 'none',
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  active_user_id CHAR(36) GENERATED ALWAYS AS (
    CASE WHEN is_active = 1 THEN user_id ELSE NULL END
  ) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY mc_endpoint_configs_user_client_unique (user_id, client_id),
  UNIQUE KEY mc_endpoint_configs_one_active_per_user (active_user_id),
  KEY mc_endpoint_configs_user_updated_idx (user_id, updated_at),
  CONSTRAINT mc_endpoint_configs_user_fk
    FOREIGN KEY (user_id) REFERENCES mc_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mc_dashboard_links (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  config_id CHAR(36) NOT NULL,
  client_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  template_id VARCHAR(100) NOT NULL DEFAULT 'station2',
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY mc_dashboard_links_user_client_unique (user_id, client_id),
  UNIQUE KEY mc_dashboard_links_user_template_slug_unique (user_id, template_id, slug),
  KEY mc_dashboard_links_public_lookup_idx (template_id, slug),
  KEY mc_dashboard_links_user_updated_idx (user_id, updated_at),
  KEY mc_dashboard_links_config_id_idx (config_id),
  CONSTRAINT mc_dashboard_links_user_fk
    FOREIGN KEY (user_id) REFERENCES mc_users(id)
    ON DELETE CASCADE,
  CONSTRAINT mc_dashboard_links_config_fk
    FOREIGN KEY (config_id) REFERENCES mc_endpoint_configs(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
