const express = require("express");
const { createPetengoranStationHandler } = require("../controllers/petengoranStationController");
const { validatePaginationQuery } = require("../validators/queryParams");

const router = express.Router();

// Station 1 (topic4)
router.get(
  "/petengoran/station1/history",
  validatePaginationQuery,
  createPetengoranStationHandler("station1", "history")
);
router.get("/petengoran/station1/latest", createPetengoranStationHandler("station1", "latest"));
router.get(
  "/petengoran/station1/activity-calendar",
  createPetengoranStationHandler("station1", "activity-calendar")
);

// Station 2 (topic5)
router.get(
  "/petengoran/station2/history",
  validatePaginationQuery,
  createPetengoranStationHandler("station2", "history")
);
router.get("/petengoran/station2/latest", createPetengoranStationHandler("station2", "latest"));
router.get(
  "/petengoran/station2/activity-calendar",
  createPetengoranStationHandler("station2", "activity-calendar")
);

// Backward-compatibility aliases
router.get(
  "/petengoran/topic4",
  validatePaginationQuery,
  createPetengoranStationHandler("station1", "history")
);
router.get(
  "/petengoran/topic4/history",
  validatePaginationQuery,
  createPetengoranStationHandler("station1", "history")
);
router.get("/petengoran/topic4/latest", createPetengoranStationHandler("station1", "latest"));

router.get(
  "/petengoran/topic5",
  validatePaginationQuery,
  createPetengoranStationHandler("station2", "history")
);
router.get(
  "/petengoran/topic5/history",
  validatePaginationQuery,
  createPetengoranStationHandler("station2", "history")
);
router.get("/petengoran/topic5/latest", createPetengoranStationHandler("station2", "latest"));

module.exports = {
  petengoranStationRouter: router,
};
