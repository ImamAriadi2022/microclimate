const { getPoolBySource } = require("../config/database");
const { env } = require("../config/env");
const {
  getPetengoranStationHistory,
  getPetengoranStationLatest,
  getPetengoranStationActivityCalendar,
} = require("../services/petengoranStationService");

const createPetengoranStationHandler = (station, mode = "history") => {
  return async (req, res, next) => {
    try {
      const pool = getPoolBySource("petengoran");
      let rows;

      if (mode === "latest") {
        rows = await getPetengoranStationLatest(pool, station);
      } else if (mode === "activity-calendar") {
        const fromRaw = req.query.from;
        const toRaw = req.query.to;

        const from = fromRaw ? new Date(fromRaw) : new Date("2023-01-01T00:00:00.000Z");
        const to = toRaw ? new Date(toRaw) : new Date();

        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          rows = [];
        } else {
          rows = await getPetengoranStationActivityCalendar(pool, station, {
            from: from.toISOString(),
            to: to.toISOString(),
          });
        }
      } else {
        rows = await getPetengoranStationHistory(pool, station, req.pagination, {
          defaultLimit: env.topic4.defaultLimit,
          defaultOffset: env.topic4.defaultOffset,
        });
      }

      res.status(200).json({ result: rows });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  createPetengoranStationHandler,
};
