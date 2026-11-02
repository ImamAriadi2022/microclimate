const { ApiError } = require("../utils/apiError");

const allowedSources = new Set(["petengoran", "dashboard", "kalimantan"]);
const COMPASS_DIRECTIONS = [
  "Utara",
  "Timur Laut",
  "Timur",
  "Tenggara",
  "Selatan",
  "Barat Daya",
  "Barat",
  "Barat Laut",
];

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const buildRecord = (source, offset = 0) => {
  const timestampDate = new Date(Date.now() - offset * 15 * 60 * 1000);
  const timestamp = timestampDate.toISOString();
  const sourceSeed = source === "petengoran" ? 1 : source === "kalimantan" ? 3 : 2;
  const hourFloat = timestampDate.getHours() + timestampDate.getMinutes() / 60;
  const diurnalWave = Math.sin(((hourFloat - 7) / 24) * 2 * Math.PI);
  const secondaryWave = Math.cos((offset + sourceSeed * 3) * 0.35);

  const temperature = Number(
    (27.5 + sourceSeed * 0.4 + diurnalWave * 3.8 + secondaryWave * 0.6).toFixed(1)
  );
  const humidity = Number(
    Math.min(
      98,
      Math.max(48, 78 - sourceSeed * 1.5 - diurnalWave * 14 + secondaryWave * 2.5)
    ).toFixed(1)
  );
  const isDaytime = hourFloat >= 6 && hourFloat <= 18;
  const irradiation = isDaytime
    ? Number(
        Math.max(
          20,
          680 * Math.sin(((hourFloat - 6) / 12) * Math.PI) + secondaryWave * 45
        ).toFixed(1)
      )
    : 0;
  const windSpeed = Number(
    Math.max(0.5, 4.2 + sourceSeed * 0.5 + diurnalWave * 2.1 + secondaryWave * 1.1).toFixed(1)
  );
  const rainfall =
    (offset + sourceSeed) % 11 === 0
      ? Number((1.2 + ((offset % 5) * 0.6)).toFixed(1))
      : 0;
  const dirIdx = (offset + sourceSeed) % COMPASS_DIRECTIONS.length;
  const angle = (dirIdx * 45 + ((offset * 7) % 25)) % 360;
  const airPressure = Number(
    (1009.5 + sourceSeed * 0.3 + Math.sin(offset * 0.2) * 2.2).toFixed(1)
  );
  const bmpTemperature = Number((temperature - 0.3).toFixed(1));
  const suhuAir = Number((temperature - 1.4).toFixed(1));

  return {
    timestamp,
    humidity,
    temperature,
    AirPressure: airPressure,
    airPressure,
    windSpeed,
    rainfall,
    angle,
    suhuAir,
    irradiation,
    pyrano: irradiation,
    bmpTemperature,
    direction: COMPASS_DIRECTIONS[dirIdx],
  };
};

const validateSource = (source) => {
  if (!allowedSources.has(source)) {
    throw new ApiError(
      400,
      "Source simulasi tidak valid. Gunakan petengoran, dashboard, atau kalimantan."
    );
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

    const limit = Math.min(parsePositiveInt(req.query.limit, 96), 3500);
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
