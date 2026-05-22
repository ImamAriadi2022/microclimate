const { Pool } = require("pg");
const { env } = require("./env");

const createPool = () => {
  if (!env.db.name) {
    return null;
  }

  return new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    connectionTimeoutMillis: env.db.connectionTimeoutMs,
    query_timeout: env.db.queryTimeoutMs,
  });
};

const pools = {
  app: createPool(),
};

const getPoolBySource = (source) => pools[source] || null;

const checkPoolsHealth = async () => {
  if (!pools.app) {
    return { app: "not-configured" };
  }

  try {
    await pools.app.query("SELECT 1");
    return { app: "ok" };
  } catch (_error) {
    return { app: "error" };
  }
};

module.exports = {
  pools,
  getPoolBySource,
  checkPoolsHealth,
};
