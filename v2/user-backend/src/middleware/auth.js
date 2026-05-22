const { getPoolBySource } = require("../config/database");
const { getUserByToken } = require("../services/userAccountService");
const { ApiError } = require("../utils/apiError");
const { toUserResponse } = require("../utils/userSerializer");

const requireAuth = async (req, _res, next) => {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      next(new ApiError(401, "Token login dibutuhkan."));
      return;
    }

    const pool = getPoolBySource("app");
    const user = await getUserByToken(pool, match[1]);

    if (!user) {
      next(new ApiError(401, "Token login tidak valid atau sudah kedaluwarsa."));
      return;
    }

    req.user = user;
    req.userResponse = toUserResponse(user);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
};
