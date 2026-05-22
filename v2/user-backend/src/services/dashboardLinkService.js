const crypto = require("crypto");
const { ApiError } = require("../utils/apiError");
const { toDashboardLinkResponse } = require("../utils/userSerializer");

const slugPattern = /^[a-z0-9-]{3,64}$/;

const ensurePool = (pool) => {
  if (!pool) {
    throw new ApiError(500, "Database aplikasi belum dikonfigurasi.");
  }
};

const normalizeClientId = (value) =>
  String(value || "").trim() || `link-${crypto.randomUUID()}`;

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const validatePayload = (payload) => {
  const name = String(payload.name || "").trim();
  const slug = normalizeSlug(payload.slug);
  const templateId = String(payload.templateId || "station2").trim();
  const configId = String(payload.configId || "").trim();

  if (!name) {
    throw new ApiError(400, "Nama dashboard wajib diisi.");
  }
  if (!slugPattern.test(slug)) {
    throw new ApiError(400, "Slug harus 3-64 karakter dan hanya berisi a-z, 0-9, atau tanda hubung.");
  }
  if (!configId) {
    throw new ApiError(400, "Konfigurasi data source wajib dipilih.");
  }

  return {
    clientId: normalizeClientId(payload.id),
    name,
    slug,
    templateId,
    configId,
    published: Boolean(payload.published),
  };
};

const listDashboardLinks = async (pool, userId) => {
  ensurePool(pool);

  const result = await pool.query(
    `SELECT l.*, c.client_id AS config_client_id
     FROM mc_dashboard_links l
     LEFT JOIN mc_endpoint_configs c ON c.id = l.config_id
     WHERE l.user_id = $1
     ORDER BY l.updated_at DESC`,
    [userId]
  );

  return result.rows.map(toDashboardLinkResponse);
};

const resolveConfigId = async (pool, userId, clientId) => {
  const result = await pool.query(
    "SELECT id FROM mc_endpoint_configs WHERE user_id = $1 AND client_id = $2",
    [userId, clientId]
  );

  if (!result.rows[0]) {
    throw new ApiError(400, "Konfigurasi data source tidak ditemukan.");
  }

  return result.rows[0].id;
};

const upsertDashboardLink = async (pool, userId, payload) => {
  ensurePool(pool);

  const link = validatePayload(payload);
  const configId = await resolveConfigId(pool, userId, link.configId);

  try {
    const result = await pool.query(
      `INSERT INTO mc_dashboard_links (
         user_id, client_id, name, slug, template_id, published, config_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, client_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         template_id = EXCLUDED.template_id,
         published = EXCLUDED.published,
         config_id = EXCLUDED.config_id,
         updated_at = NOW()
       RETURNING *,
         (SELECT client_id FROM mc_endpoint_configs WHERE id = mc_dashboard_links.config_id) AS config_client_id`,
      [userId, link.clientId, link.name, link.slug, link.templateId, link.published, configId]
    );

    return toDashboardLinkResponse(result.rows[0]);
  } catch (error) {
    if (error && error.code === "23505") {
      throw new ApiError(409, "Slug dashboard sudah dipakai.");
    }
    throw error;
  }
};

const publishDashboardLink = async (pool, userId, clientId) => {
  ensurePool(pool);

  const result = await pool.query(
    `UPDATE mc_dashboard_links
     SET published = true,
         updated_at = NOW()
     WHERE user_id = $1 AND client_id = $2
     RETURNING *,
       (SELECT client_id FROM mc_endpoint_configs WHERE id = mc_dashboard_links.config_id) AS config_client_id`,
    [userId, clientId]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Link dashboard tidak ditemukan.");
  }

  return toDashboardLinkResponse(result.rows[0]);
};

const deleteDashboardLink = async (pool, userId, clientId) => {
  ensurePool(pool);

  const result = await pool.query(
    "DELETE FROM mc_dashboard_links WHERE user_id = $1 AND client_id = $2 RETURNING client_id",
    [userId, clientId]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Link dashboard tidak ditemukan.");
  }
};

const getPublicDashboardLink = async (pool, templateId, slug) => {
  ensurePool(pool);

  const result = await pool.query(
    `SELECT
       l.*,
       c.client_id AS config_client_id,
       c.name AS config_name,
       c.source_type,
       c.template_id AS config_template_id,
       c.base_url,
       c.broker_url,
       c.endpoint_map,
       c.topic_map,
       c.use_single_endpoint,
       c.client_resample,
       c.is_active
     FROM mc_dashboard_links l
     JOIN mc_endpoint_configs c ON c.id = l.config_id
     WHERE l.template_id = $1 AND l.slug = $2
     LIMIT 1`,
    [templateId, slug]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ApiError(404, "Link dashboard tidak ditemukan.");
  }

  return {
    link: toDashboardLinkResponse(row),
    config: {
      id: row.config_client_id,
      name: row.config_name,
      type: row.source_type,
      templateId: row.config_template_id,
      baseUrl: row.base_url || "",
      brokerUrl: row.broker_url || "",
      endpointMap: row.endpoint_map || {},
      topicMap: row.topic_map || {},
      useSingleEndpoint: Boolean(row.use_single_endpoint),
      clientResample: row.client_resample || "none",
      isActive: Boolean(row.is_active),
    },
  };
};

module.exports = {
  listDashboardLinks,
  upsertDashboardLink,
  publishDashboardLink,
  deleteDashboardLink,
  getPublicDashboardLink,
};
