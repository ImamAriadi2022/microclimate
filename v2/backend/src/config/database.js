const { Pool } = require("pg");
const { env } = require("./env");

const sharedDbConfig = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  connectionTimeoutMillis: env.db.connectionTimeoutMs,
  query_timeout: env.db.queryTimeoutMs,
};

const createPool = (database) => {
  if (!database) {
    return null;
  }

  return new Pool({
    ...sharedDbConfig,
    database,
  });
};

const pools = {
  petengoran: createPool(env.db.names.petengoran),
  dashboard: createPool(env.db.names.dashboard),
};

const getPoolBySource = (source) => {
  return pools[source] || null;
};

const checkPoolsHealth = async () => {
  const entries = Object.entries(pools);
  const result = {};

  for (const [name, pool] of entries) {
    if (!pool) {
      result[name] = "not-configured";
      continue;
    }

    try {
      await pool.query("SELECT 1");
      result[name] = "ok";
    } catch (_error) {
      result[name] = "error";
    }
  }

  return result;
};

module.exports = {
  pools,
  getPoolBySource,
  checkPoolsHealth,
};
