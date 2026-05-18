const { getPoolBySource } = require("../config/database");
const { getTopic4History, getTopic4Latest } = require("../services/topic4Service");

const createTopic4Handler = (source, mode = "history") => {
  return async (req, res, next) => {
    try {
      const pool = getPoolBySource(source);
      const rows =
        mode === "latest"
          ? await getTopic4Latest(pool, source)
          : await getTopic4History(pool, source, req.pagination);

      res.status(200).json({ result: rows });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  createTopic4Handler,
};
