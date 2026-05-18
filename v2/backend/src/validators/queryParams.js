const { env, parseNonNegativeInteger, parsePositiveInteger } = require("../config/env");
const { ApiError } = require("../utils/apiError");

const validatePaginationQuery = (req, _res, next) => {
  const limitRaw = req.query.limit;
  const offsetRaw = req.query.offset;
  const atTimeRaw = req.query.atTime;
  const startTimeRaw = req.query.startTime;
  const endTimeRaw = req.query.endTime;

  const limit =
    limitRaw === undefined
      ? env.topic4.defaultLimit
      : parsePositiveInteger(limitRaw, Number.NaN);

  const offset =
    offsetRaw === undefined
      ? env.topic4.defaultOffset
      : parseNonNegativeInteger(offsetRaw, Number.NaN);

  if (!Number.isFinite(limit)) {
    next(new ApiError(400, "Query parameter 'limit' harus bilangan bulat positif."));
    return;
  }

  if (!Number.isFinite(offset)) {
    next(new ApiError(400, "Query parameter 'offset' harus bilangan bulat nol atau lebih."));
    return;
  }

  if (limit > env.topic4.maxLimit) {
    next(new ApiError(400, `Query parameter 'limit' maksimal ${env.topic4.maxLimit}.`));
    return;
  }

  const parseDateQuery = (name, rawValue) => {
    if (rawValue === undefined) return null;

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new ApiError(
        400,
        `Query parameter '${name}' tidak valid. Gunakan format tanggal/waktu yang dapat diparse JavaScript (disarankan ISO-8601).`
      );
    }

    return parsedDate.toISOString();
  };

  let atTime;
  let startTime;
  let endTime;
  try {
    atTime = parseDateQuery("atTime", atTimeRaw);
    startTime = parseDateQuery("startTime", startTimeRaw);
    endTime = parseDateQuery("endTime", endTimeRaw);
  } catch (error) {
    next(error);
    return;
  }

  // Backward compatibility: atTime behaves as endTime when endTime is not provided.
  if (!endTime && atTime) {
    endTime = atTime;
  }

  if (startTime && endTime && new Date(startTime).getTime() > new Date(endTime).getTime()) {
    next(new ApiError(400, "Query parameter 'startTime' tidak boleh lebih besar dari 'endTime'."));
    return;
  }

  req.pagination = {
    limit,
    offset,
    atTime,
    startTime,
    endTime,
  };

  next();
};

module.exports = {
  validatePaginationQuery,
};
