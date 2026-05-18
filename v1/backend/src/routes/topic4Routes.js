const express = require("express");
const { createTopic4Handler } = require("../controllers/topic4Controller");
const { validatePaginationQuery } = require("../validators/queryParams");

const router = express.Router();

router.get("/dashboard/topic4", validatePaginationQuery, createTopic4Handler("dashboard", "history"));

router.get(
  "/dashboard/topic4/history",
  validatePaginationQuery,
  createTopic4Handler("dashboard", "history")
);
router.get("/dashboard/topic4/latest", createTopic4Handler("dashboard", "latest"));

module.exports = {
  topic4Router: router,
};
