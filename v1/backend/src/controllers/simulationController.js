const { ApiError } = require("../utils/apiError");

const allowedSources = new Set(["petengoran", "dashboard"]);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const buildRecord = (source, offset = 0) => {
  const timestamp = new Date(Date.now() - offset * 5 * 60 * 1000).toISOString();
  const sourceSeed = source === "petengoran" ? 1 : 2;

  return {
    timestamp,
    humidity: 70 + sourceSeed + (offset % 10) * 0.1,
    temperature: 28 + sourceSeed + (offset % 7) * 0.1,
    AirPressure: 1008 + sourceSeed + (offset % 5) * 0.1,
    windSpeed: 1 + sourceSeed + (offset % 4) * 0.2,
    rainfall: offset % 3 === 0 ? 0.1 : 0,
    angle: 80 + sourceSeed * 10 + (offset % 20),
    suhuAir: 27 + sourceSeed + (offset % 6) * 0.1,
    irradiation: 400 + sourceSeed * 30 + (offset % 50),
    bmpTemperature: 27 + sourceSeed + (offset % 5) * 0.1,
    direction: "Simulated",
  };
};

const validateSource = (source) => {
  if (!allowedSources.has(source)) {
    throw new ApiError(400, "Source simulasi tidak valid. Gunakan petengoran atau dashboard.");
  }
};

const getSimulationLatest = (req, res, next) => {
  try {
    const { source } = req.params;
    validateSource(source);

    res.status(200).json({
      result: [buildRecord(source, 0)],
      meta: {
        mode: "simulation",
        source,
        type: "latest",
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSimulationHistory = (req, res, next) => {
  try {
    const { source } = req.params;
    validateSource(source);

    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 200);
    const offset = Math.max(parsePositiveInt(req.query.offset, 0), 0);
    const result = [];

    for (let i = 0; i < limit; i += 1) {
      result.push(buildRecord(source, offset + i));
    }

    res.status(200).json({
      result,
      meta: {
        mode: "simulation",
        source,
        type: "history",
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSimulationLatest,
  getSimulationHistory,
};
