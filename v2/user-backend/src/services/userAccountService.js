const crypto = require("crypto");
const { ApiError } = require("../utils/apiError");
const { hashPassword, hashToken, verifyPassword } = require("../utils/password");
const { toUserResponse } = require("../utils/userSerializer");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildUsername = (value) => {
  const base = normalizeEmail(value).split("@")[0] || "user";
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "user";
};

const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const ensurePool = (pool) => {
  if (!pool) {
    throw new ApiError(500, "Database aplikasi belum dikonfigurasi.");
  }
};

const mapUniqueError = (error) => {
  if (error && error.code === "23505") {
    throw new ApiError(409, "Email atau username sudah terdaftar.");
  }
  throw error;
};

const createSession = async (pool, userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  await pool.query(
    `INSERT INTO mc_user_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
};

const registerUser = async (pool, payload) => {
  ensurePool(pool);

  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const fullName = String(payload.fullName || "").trim();
  const username = normalizeUsername(payload.username) || buildUsername(email);

  if (!emailPattern.test(email)) {
    throw new ApiError(400, "Format email tidak valid.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password minimal 8 karakter.");
  }
  if (!fullName) {
    throw new ApiError(400, "Nama lengkap wajib diisi.");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username minimal 3 karakter.");
  }

  try {
    const result = await pool.query(
      `INSERT INTO mc_users (email, username, full_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, username, fullName, hashPassword(password)]
    );
    const user = result.rows[0];
    const token = await createSession(pool, user.id);

    return { token, user: toUserResponse(user) };
  } catch (error) {
    mapUniqueError(error);
  }
};

const loginUser = async (pool, payload) => {
  ensurePool(pool);

  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  const result = await pool.query("SELECT * FROM mc_users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new ApiError(401, "Email atau password tidak sesuai.");
  }

  const token = await createSession(pool, user.id);
  return { token, user: toUserResponse(user) };
};

const getUserByToken = async (pool, token) => {
  ensurePool(pool);

  const tokenHash = hashToken(token);
  const result = await pool.query(
    `SELECT u.*
     FROM mc_user_sessions s
     JOIN mc_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] || null;
};

const updateProfile = async (pool, userId, payload) => {
  ensurePool(pool);

  const fullName = String(payload.fullName || "").trim();
  const username = normalizeUsername(payload.username);
  const profilePhoto = String(payload.profilePhoto || "");

  if (!fullName) {
    throw new ApiError(400, "Nama lengkap wajib diisi.");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username minimal 3 karakter.");
  }

  try {
    const result = await pool.query(
      `UPDATE mc_users
       SET full_name = $2,
           username = $3,
           profile_photo = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, fullName, username, profilePhoto]
    );

    return toUserResponse(result.rows[0]);
  } catch (error) {
    mapUniqueError(error);
  }
};

const updateEmail = async (pool, userId, payload) => {
  ensurePool(pool);

  const oldEmail = normalizeEmail(payload.oldEmail);
  const newEmail = normalizeEmail(payload.newEmail);

  if (!emailPattern.test(newEmail)) {
    throw new ApiError(400, "Format email baru tidak valid.");
  }
  if (oldEmail === newEmail) {
    throw new ApiError(400, "Email baru tidak boleh sama dengan email lama.");
  }

  const current = await pool.query("SELECT email FROM mc_users WHERE id = $1", [userId]);
  if (!current.rows[0] || current.rows[0].email !== oldEmail) {
    throw new ApiError(400, "Email lama tidak sesuai dengan email akun saat ini.");
  }

  try {
    const result = await pool.query(
      `UPDATE mc_users
       SET email = $2,
           username = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, newEmail, buildUsername(newEmail)]
    );

    return toUserResponse(result.rows[0]);
  } catch (error) {
    mapUniqueError(error);
  }
};

const updatePassword = async (pool, userId, payload) => {
  ensurePool(pool);

  const newPassword = String(payload.newPassword || "");
  if (newPassword.length < 8) {
    throw new ApiError(400, "Password baru minimal 8 karakter.");
  }

  await pool.query(
    `UPDATE mc_users
     SET password_hash = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, hashPassword(newPassword)]
  );
};

module.exports = {
  buildUsername,
  registerUser,
  loginUser,
  getUserByToken,
  updateProfile,
  updateEmail,
  updatePassword,
};
