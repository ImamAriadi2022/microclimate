const express = require("express");
const cors = require("cors");
const { healthRouter } = require("./routes/healthRoutes");
const { userFeatureRouter } = require("./routes/userFeatureRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use(healthRouter);
app.use(userFeatureRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
