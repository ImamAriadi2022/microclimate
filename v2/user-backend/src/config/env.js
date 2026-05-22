const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const env = {
  port: parsePositiveInteger(process.env.PORT, 3001),
  db: {
    host: process.env.DB_HOST,
    port: parsePositiveInteger(process.env.DB_PORT, 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME_USER || process.env.DB_NAME,
    connectionTimeoutMs: parsePositiveInteger(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
    queryTimeoutMs: parsePositiveInteger(process.env.DB_QUERY_TIMEOUT_MS, 10000),
  },
};

module.exports = {
  env,
  parsePositiveInteger,
};
