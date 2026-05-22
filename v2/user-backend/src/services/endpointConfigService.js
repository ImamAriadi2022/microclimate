const crypto = require("crypto");
const { ApiError } = require("../utils/apiError");
const { toConfigResponse } = require("../utils/userSerializer");

const ensurePool = (pool) => {
  if (!pool) {
    throw new ApiError(500, "Database aplikasi belum dikonfigurasi.");
  }
};

const normalizeClientId = (value, prefix) =>
  String(value || "").trim() || `${prefix}-${crypto.randomUUID()}`;

const validateConfigPayload = (payload) => {
  const name = String(payload.name || "").trim();
  const type = String(payload.type || "backend").trim();
  const templateId = String(payload.templateId || "station2").trim();
  const baseUrl = String(payload.baseUrl || "").trim();
  const brokerUrl = String(payload.brokerUrl || "").trim();

  if (!name) {
    throw new ApiError(400, "Nama konfigurasi wajib diisi.");
  }
  if (!["backend", "mqtt"].includes(type)) {
    throw new ApiError(400, "Jenis data source tidak valid.");
  }
  if (type === "backend" && !baseUrl) {
    throw new ApiError(400, "Base URL backend wajib diisi.");
  }
  if (type === "mqtt" && !brokerUrl) {
    throw new ApiError(400, "Broker MQTT wajib diisi.");
  }

  return {
    clientId: normalizeClientId(payload.id, "cfg"),
    name,
    sourceType: type,
    templateId,
    baseUrl,
    brokerUrl,
    endpointMap: payload.endpointMap || {},
    topicMap: payload.topicMap || {},
    useSingleEndpoint: Boolean(payload.useSingleEndpoint),
    clientResample: String(payload.clientResample || "none").trim(),
  };
};

const listEndpointConfigs = async (pool, userId) => {
  ensurePool(pool);

  const result = await pool.query(
    `SELECT *
     FROM mc_endpoint_configs
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );

  return result.rows.map(toConfigResponse);
};

const upsertEndpointConfig = async (pool, userId, payload) => {
  ensurePool(pool);

  const config = validateConfigPayload(payload);
  const result = await pool.query(
    `INSERT INTO mc_endpoint_configs (
       user_id, client_id, name, source_type, template_id, base_url, broker_url,
       endpoint_map, topic_map, use_single_endpoint, client_resample, is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, false)
     ON CONFLICT (user_id, client_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       source_type = EXCLUDED.source_type,
       template_id = EXCLUDED.template_id,
       base_url = EXCLUDED.base_url,
       broker_url = EXCLUDED.broker_url,
       endpoint_map = EXCLUDED.endpoint_map,
       topic_map = EXCLUDED.topic_map,
       use_single_endpoint = EXCLUDED.use_single_endpoint,
       client_resample = EXCLUDED.client_resample,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      config.clientId,
      config.name,
      config.sourceType,
      config.templateId,
      config.baseUrl,
      config.brokerUrl,
      JSON.stringify(config.endpointMap),
      JSON.stringify(config.topicMap),
      config.useSingleEndpoint,
      config.clientResample,
    ]
  );

  return toConfigResponse(result.rows[0]);
};

const activateEndpointConfig = async (pool, userId, clientId) => {
  ensurePool(pool);

  const found = await pool.query(
    "SELECT id FROM mc_endpoint_configs WHERE user_id = $1 AND client_id = $2",
    [userId, clientId]
  );

  if (!found.rows[0]) {
    throw new ApiError(404, "Konfigurasi tidak ditemukan.");
  }

  await pool.query("UPDATE mc_endpoint_configs SET is_active = false WHERE user_id = $1", [userId]);
  const result = await pool.query(
    `UPDATE mc_endpoint_configs
     SET is_active = true,
         updated_at = NOW()
     WHERE user_id = $1 AND client_id = $2
     RETURNING *`,
    [userId, clientId]
  );

  return toConfigResponse(result.rows[0]);
};

const deleteEndpointConfig = async (pool, userId, clientId) => {
  ensurePool(pool);

  const result = await pool.query(
    "DELETE FROM mc_endpoint_configs WHERE user_id = $1 AND client_id = $2 RETURNING client_id",
    [userId, clientId]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "Konfigurasi tidak ditemukan.");
  }
};

module.exports = {
  listEndpointConfigs,
  upsertEndpointConfig,
  activateEndpointConfig,
  deleteEndpointConfig,
};
