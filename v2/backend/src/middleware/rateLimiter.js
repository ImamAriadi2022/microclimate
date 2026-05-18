const rateLimit = require("express-rate-limit");

const publicApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak request. Coba lagi sebentar lagi.",
  },
});

module.exports = {
  publicApiRateLimiter,
};
