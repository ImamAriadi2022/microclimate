const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

const loadEnv = () => {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
};

const getEnv = () => {
  const { env } = require("../src/config/env");
  return env;
};

const getArgValue = (names) => {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (names.includes(argv[i]) && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  return null;
};

const resolveSqlPath = () => {
  const argPath = getArgValue(["--file", "-f"]);
  const envPath = process.env.SQL_FILE;
  const fallback = path.join(__dirname, "..", "sql", "001_user_features.sql");
  const rawPath = argPath || envPath || fallback;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
};

const shouldDebug = () => process.argv.includes("--debug");

const splitStatements = (sql) => {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
};

const extractForeignKeyError = (statusText) => {
  const marker = "LATEST FOREIGN KEY ERROR";
  const index = statusText.indexOf(marker);
  if (index === -1) {
    return null;
  }

  return statusText.slice(index, index + 2000).trim();
};

const assertEnv = (env) => {
  if (!env.db.host || !env.db.user || !env.db.name) {
    throw new Error("Missing DB config. Set MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE in .env.");
  }

  if (typeof env.db.password === "string" && env.db.password.trim() !== env.db.password) {
    throw new Error("MYSQL_PASSWORD has leading/trailing spaces. Remove them in .env.");
  }
};

const run = async () => {
  loadEnv();
  const env = getEnv();
  assertEnv(env);

  const sqlPath = resolveSqlPath();
  const sql = await fs.readFile(sqlPath, "utf8");
  const statements = splitStatements(sql);

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    connectTimeout: env.db.connectionTimeoutMs,
  });

  try {
    for (let index = 0; index < statements.length; index += 1) {
      const statement = statements[index];
      if (shouldDebug()) {
        // eslint-disable-next-line no-console
        console.log(`Running SQL #${index + 1}: ${statement.slice(0, 120)}...`);
      }

      await connection.query(statement);
    }
    // eslint-disable-next-line no-console
    console.log("SQL executed successfully.");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("SQL execution failed:", error.message || error);

    try {
      const [statusRows] = await connection.query("SHOW ENGINE INNODB STATUS");
      const statusText = statusRows?.[0]?.Status || statusRows?.[0]?.status;
      const fkError = statusText ? extractForeignKeyError(statusText) : null;
      if (fkError) {
        // eslint-disable-next-line no-console
        console.error(fkError);
      }
    } catch (statusError) {
      // eslint-disable-next-line no-console
      console.error("Failed to read InnoDB status:", statusError.message || statusError);
    }

    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unexpected error:", error.message || error);
  process.exitCode = 1;
});
