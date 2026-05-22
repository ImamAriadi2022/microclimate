const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const firstDefined = (...values) => values.find((value) => value !== undefined);

const env = {
  port: parsePositiveInteger(process.env.PORT, 3001),
  db: {
    host: firstDefined(process.env.MYSQL_HOST, process.env.DB_HOST),
    port: parsePositiveInteger(firstDefined(process.env.MYSQL_PORT, process.env.DB_PORT), 3306),
    user: firstDefined(process.env.MYSQL_USER, process.env.DB_USERNAME),
    password: firstDefined(process.env.MYSQL_PASSWORD, process.env.DB_PASSWORD),
    name: firstDefined(process.env.MYSQL_DATABASE, process.env.DB_NAME_USER, process.env.DB_NAME),
    connectionLimit: parsePositiveInteger(process.env.MYSQL_CONNECTION_LIMIT, 10),
    connectionTimeoutMs: parsePositiveInteger(
      process.env.MYSQL_CONNECT_TIMEOUT_MS || process.env.DB_CONNECTION_TIMEOUT_MS,
      5000
    ),
    queryTimeoutMs: parsePositiveInteger(
      process.env.MYSQL_QUERY_TIMEOUT_MS || process.env.DB_QUERY_TIMEOUT_MS,
      10000
    ),
  },
};

module.exports = {
  env,
  parsePositiveInteger,
};
