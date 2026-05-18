const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

const assertSafeIdentifier = (identifier) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new ApiError(500, "Konfigurasi nama tabel tidak valid.");
  }

  return identifier;
};

const getTableBySource = (source) => {
  const fallback = process.env.TOPIC4_TABLE || "topic4";
  const bySource = {
    petengoran: process.env.TOPIC4_TABLE_PETENGORAN,
    dashboard: process.env.TOPIC4_TABLE_DASHBOARD,
  };

  return assertSafeIdentifier(bySource[source] || fallback);
};

const mapPostgresError = (error, tableName) => {
  if (error && error.code === "42P01") {
    throw new ApiError(
      500,
      `Tabel '${tableName}' tidak ditemukan. Periksa konfigurasi TOPIC4_TABLE atau TOPIC4_TABLE_<SUMBER>.`
    );
  }

  throw error;
};

const getTopic4History = async (pool, source, pagination) => {
  if (!pool) {
    throw new ApiError(500, "Database belum dikonfigurasi untuk endpoint ini.");
  }

  const tableName = getTableBySource(source);
  const limit = pagination?.limit ?? env.topic4.defaultLimit;
  const offset = pagination?.offset ?? env.topic4.defaultOffset;

  let rows;
  try {
    const result = await pool.query(
      `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    rows = result.rows;
  } catch (error) {
    mapPostgresError(error, tableName);
  }

  return Array.isArray(rows) ? rows : [];
};

const getTopic4Latest = async (pool, source) => {
  if (!pool) {
    throw new ApiError(500, "Database belum dikonfigurasi untuk endpoint ini.");
  }

  const tableName = getTableBySource(source);

  let rows;
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 1`);
    rows = result.rows;
  } catch (error) {
    mapPostgresError(error, tableName);
  }

  return Array.isArray(rows) ? rows : [];
};

module.exports = {
  getTopic4History,
  getTopic4Latest,
};
