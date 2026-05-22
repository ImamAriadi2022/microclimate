const toUserResponse = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    profilePhoto: row.profile_photo || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const toConfigResponse = (row) => {
  if (!row) return null;

  return {
    id: row.client_id,
    name: row.name,
    type: row.source_type,
    templateId: row.template_id,
    baseUrl: row.base_url || "",
    brokerUrl: row.broker_url || "",
    endpointMap: parseJsonValue(row.endpoint_map, {}),
    topicMap: parseJsonValue(row.topic_map, {}),
    useSingleEndpoint: Boolean(row.use_single_endpoint),
    clientResample: row.client_resample || "none",
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at,
  };
};

const toDashboardLinkResponse = (row) => {
  if (!row) return null;

  return {
    id: row.client_id,
    name: row.name,
    slug: row.slug,
    templateId: row.template_id,
    published: Boolean(row.published),
    configId: row.config_client_id || "",
    updatedAt: row.updated_at,
  };
};

module.exports = {
  parseJsonValue,
  toUserResponse,
  toConfigResponse,
  toDashboardLinkResponse,
};
