const express = require("express");
const { checkPoolsHealth } = require("../config/database");

const router = express.Router();

router.get("/health", async (_req, res) => {
  const database = await checkPoolsHealth();
  res.status(200).json({
    status: "ok",
    service: "microclimate-user-backend",
    database,
  });
});

module.exports = {
  healthRouter: router,
};
