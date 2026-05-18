const express = require("express");
const {
  getSimulationLatest,
  getSimulationHistory,
} = require("../controllers/simulationController");

const router = express.Router();

router.get("/simulate/:source/topic4/latest", getSimulationLatest);
router.get("/simulate/:source/topic4/history", getSimulationHistory);

module.exports = {
  simulationRouter: router,
};
