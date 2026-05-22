const mysql = require("mysql2/promise");
const { env } = require("./env");

const createPool = () => {
  if (!env.db.name) {
    return null;
  }

  const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: env.db.connectionLimit,
    connectTimeout: env.db.connectionTimeoutMs,
  });

  return {
    async query(sql, params = []) {
      const [rows] = await pool.query({ sql, timeout: env.db.queryTimeoutMs }, params);
      return {
        rows: Array.isArray(rows) ? rows : [],
        affectedRows: rows?.affectedRows || 0,
        insertId: rows?.insertId,
      };
    },
  };
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
