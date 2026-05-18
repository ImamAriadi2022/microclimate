const { ApiError } = require("../utils/apiError");

const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Endpoint tidak ditemukan."));
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error.message || (statusCode >= 500 ? "Internal Server Error" : "Bad Request");

  res.status(statusCode).json({ message });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
