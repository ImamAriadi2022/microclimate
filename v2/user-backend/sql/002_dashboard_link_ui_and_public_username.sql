USE `blfhdosrcfpsnyuvu90t`;

ALTER TABLE mc_dashboard_links
  ADD COLUMN ui_settings JSON NULL AFTER published,
  ADD KEY mc_dashboard_links_user_public_lookup_idx (user_id, template_id, slug);

UPDATE mc_dashboard_links
SET ui_settings = JSON_OBJECT()
WHERE ui_settings IS NULL;
