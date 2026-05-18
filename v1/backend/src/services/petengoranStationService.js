const { ApiError } = require("../utils/apiError");

const assertSafeIdentifier = (identifier) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new ApiError(500, "Konfigurasi nama tabel tidak valid.");
  }

  return identifier;
};

const resolveTableName = (station) => {
  // Keep fallback aligned with historical topic table names to avoid 500s
  // when station-specific env vars are not defined.
  const fallbackTopic4 = process.env.TOPIC4_TABLE || "topic4";
  const fallbackTopic5 = process.env.TOPIC5_TABLE || "topic5";

  const station1Table =
    process.env.PETENGORAN_STATION1_TABLE || process.env.TOPIC4_TABLE_PETENGORAN || fallbackTopic4;
  const station2Table =
    process.env.PETENGORAN_STATION2_TABLE || process.env.TOPIC5_TABLE_PETENGORAN || fallbackTopic5;

  const byStation = {
    station1: station1Table,
    station2: station2Table,
  };

  return assertSafeIdentifier(byStation[station]);
};

const mapPostgresError = (error, tableName) => {
  if (error && error.code === "42P01") {
    throw new ApiError(
      500,
      `Tabel '${tableName}' tidak ditemukan. Periksa konfigurasi PETENGORAN_STATION1_TABLE/PETENGORAN_STATION2_TABLE.`
    );
  }

  if (error && ["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH"].includes(error.code)) {
    throw new ApiError(
      503,
      "Koneksi ke database gagal. Periksa DB_HOST, DB_PORT, dan akses jaringan ke server PostgreSQL."
    );
  }

  throw error;
};

const getPetengoranStationHistory = async (pool, station, pagination, defaults) => {
  if (!pool) {
    throw new ApiError(500, "Database belum dikonfigurasi untuk endpoint ini.");
  }

  const tableName = resolveTableName(station);
  const limit = pagination?.limit ?? defaults.defaultLimit;
  const offset = pagination?.offset ?? defaults.defaultOffset;
  const startTime = pagination?.startTime;
  const endTime = pagination?.endTime || pagination?.atTime;

  let rows;
  try {
    const whereClauses = [];
    const values = [];

    if (startTime) {
      values.push(startTime);
      whereClauses.push(`timestamp >= $${values.length}`);
    }

    if (endTime) {
      values.push(endTime);
      whereClauses.push(`timestamp <= $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT * FROM ${tableName} ${whereSql} ORDER BY timestamp DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    rows = result.rows;
  } catch (error) {
    mapPostgresError(error, tableName);
  }

  return Array.isArray(rows) ? rows : [];
};

const getPetengoranStationLatest = async (pool, station) => {
  if (!pool) {
    throw new ApiError(500, "Database belum dikonfigurasi untuk endpoint ini.");
  }

  const tableName = resolveTableName(station);

  let rows;
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 1`);
    rows = result.rows;
  } catch (error) {
    mapPostgresError(error, tableName);
  }

  return Array.isArray(rows) ? rows : [];
};

const getPetengoranStationActivityCalendar = async (pool, station, range = {}) => {
  if (!pool) {
    throw new ApiError(500, "Database belum dikonfigurasi untuk endpoint ini.");
  }

  const tableName = resolveTableName(station);
  const from = range?.from || "2023-01-01T00:00:00.000Z";
  const to = range?.to || new Date().toISOString();

  let rows;
  try {
    const result = await pool.query(
      `SELECT
         DATE(timestamp) AS activity_date,
         COUNT(*)::int AS total_records,
         MIN(timestamp) AS first_timestamp,
         MAX(timestamp) AS last_timestamp
       FROM ${tableName}
       WHERE timestamp >= $1 AND timestamp <= $2
       GROUP BY DATE(timestamp)
       ORDER BY activity_date DESC`,
      [from, to]
    );

    rows = result.rows.map((row) => ({
      date: row.activity_date,
      totalRecords: row.total_records,
      firstTimestamp: row.first_timestamp,
      lastTimestamp: row.last_timestamp,
    }));
  } catch (error) {
    mapPostgresError(error, tableName);
  }

  return Array.isArray(rows) ? rows : [];
};

module.exports = {
  getPetengoranStationHistory,
  getPetengoranStationLatest,
  getPetengoranStationActivityCalendar,
};
