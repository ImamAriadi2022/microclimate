const crypto = require("crypto");

const HASH_ALGORITHM = "sha256";
const KEY_LENGTH = 64;
const DEFAULT_ITERATIONS = 120000;

const hashPassword = (password, options = {}) => {
  const iterations = options.iterations || DEFAULT_ITERATIONS;
  const salt = options.salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, HASH_ALGORITHM)
    .toString("hex");

  return `pbkdf2_${HASH_ALGORITHM}$${iterations}$${salt}$${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [scheme, iterationsRaw, salt, expectedHash] = String(storedHash || "").split("$");
  const iterations = Number(iterationsRaw);

  if (scheme !== `pbkdf2_${HASH_ALGORITHM}` || !Number.isFinite(iterations) || !salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, HASH_ALGORITHM)
    .toString("hex");

  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  hashPassword,
  verifyPassword,
  hashToken,
};
