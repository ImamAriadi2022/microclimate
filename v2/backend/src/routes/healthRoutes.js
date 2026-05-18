const express = require("express");
const { checkPoolsHealth } = require("../config/database");

const router = express.Router();

router.get("/health", async (_req, res) => {
  const databases = await checkPoolsHealth();
  const hasError = Object.values(databases).includes("error");

  res.status(hasError ? 503 : 200).json({
    message: hasError ? "degraded" : "ok",
    databases,
  });
});

module.exports = {
  healthRouter: router,
};
