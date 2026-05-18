const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parseNonNegativeInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const env = {
  port: parsePositiveInteger(process.env.PORT, 3000),
  db: {
    host: process.env.DB_HOST,
    port: parsePositiveInteger(process.env.DB_PORT, 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMs: parsePositiveInteger(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
    queryTimeoutMs: parsePositiveInteger(process.env.DB_QUERY_TIMEOUT_MS, 10000),
    names: {
      petengoran: process.env.DB_NAME,
      dashboard: process.env.DB_NAME_DASHBOARD || process.env.DB_NAME,
    },
  },
  topic4: {
    table: process.env.TOPIC4_TABLE || "topic4",
    defaultLimit: parsePositiveInteger(process.env.TOPIC4_LIMIT, 100),
    defaultOffset: parseNonNegativeInteger(process.env.TOPIC4_OFFSET, 0),
    maxLimit: parsePositiveInteger(process.env.TOPIC4_MAX_LIMIT, 500),
  },
};

module.exports = {
  env,
  parsePositiveInteger,
  parseNonNegativeInteger,
};
